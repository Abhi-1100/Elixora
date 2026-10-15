"""Server-side Gemini vision extraction and conservative dataset verification."""

from __future__ import annotations

import json
import os
import re
from functools import lru_cache
from difflib import SequenceMatcher
from typing import Any

from flask import current_app

try:
    from thefuzz import process
except ImportError:  # pragma: no cover - thefuzz is in backend/requirements.txt
    process = None


MODEL_DEFAULT = "gemini-3.8-flash"
REQUEST_TIMEOUT_MS = 20_000
MAX_INGREDIENTS = 8


def _normalized(value: str) -> str:
    return " ".join(re.findall(r"[a-z0-9]+", value.casefold()))


def _similarity(left: str, right: str) -> float:
    left_norm, right_norm = _normalized(left), _normalized(right)
    if not left_norm or not right_norm:
        return 0.0
    if left_norm == right_norm:
        return 1.0
    left_tokens, right_tokens = left_norm.split(), right_norm.split()
    if any(
        shorter[index:index + len(longer)] == longer
        for shorter, longer in ((left_tokens, right_tokens), (right_tokens, left_tokens))
        for index in range(max(0, len(shorter) - len(longer) + 1))
    ):
        return 1.0
    return SequenceMatcher(None, left_norm, right_norm).ratio()


def _extract_with_gemini(image_bytes: bytes, mime_type: str) -> tuple[dict[str, Any] | None, str]:
    """Return validated visual label fields and a non-sensitive service status."""
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    if not api_key:
        return None, "not_configured"
    if mime_type not in {"image/jpeg", "image/png", "image/webp"}:
        return None, "unsupported_image"

    try:
        from google import genai
        from google.genai import types

        client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
        )
        schema = {
            "type": "OBJECT",
            "properties": {
                "brand_name": {"type": "STRING", "nullable": True},
                "active_ingredients": {"type": "ARRAY", "items": {"type": "STRING"}},
                "strength": {"type": "STRING", "nullable": True},
                "label_readable": {"type": "BOOLEAN"},
            },
            "required": ["brand_name", "active_ingredients", "strength", "label_readable"],
        }
        prompt = (
            "Read only text visibly printed on this medicine package. Extract the brand name and "
            "active ingredients exactly as printed, plus strength if readable. Do not infer a "
            "medicine from color, shape, or use. Do not provide dosage, treatment advice, or uses. "
            "If the name or ingredients cannot be read, return null or an empty list and set "
            "label_readable false. Return only the requested structured fields."
        )
        response = client.models.generate_content(
            model=os.getenv("GEMINI_MODEL", MODEL_DEFAULT),
            contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0,
                http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS),
            ),
        )
        payload = json.loads(response.text or "{}")
        brand = payload.get("brand_name")
        ingredients = payload.get("active_ingredients")
        if not isinstance(brand, str):
            brand = None
        brand = brand.strip()[:120] if brand and brand.strip() else None
        if not isinstance(ingredients, list):
            ingredients = []
        ingredients = [item.strip()[:120] for item in ingredients if isinstance(item, str) and item.strip()][:MAX_INGREDIENTS]
        strength = payload.get("strength")
        if not isinstance(strength, str):
            strength = None
        strength = strength.strip()[:80] if strength and strength.strip() else None
        if not brand and not ingredients:
            return None, "unreadable"
        return {
            "brand_name": brand,
            "active_ingredients": ingredients,
            "strength": strength,
            "label_readable": payload.get("label_readable") is True,
        }, "ok"
    except Exception as error:  # SDK/network exception formats may contain request details.
        code = getattr(error, "code", None)
        status = str(code or "").lower()
        class_name = type(error).__name__.lower()
        safe_error_text = str(error).lower()
        invalid_key_message = "api key" in safe_error_text and any(
            phrase in safe_error_text for phrase in ("invalid", "not valid", "unauthorized", "incorrect")
        )
        if "timeout" in class_name or "deadline" in status or str(code) in {"408", "504"}:
            result = "timeout"
        elif "429" in status or "resource_exhausted" in status or "quota" in class_name:
            result = "rate_limited"
        elif "api_key" in status or "unauthenticated" in status or "permission_denied" in status or str(code) in {"401", "403"} or invalid_key_message:
            result = "invalid_key"
        else:
            result = "unavailable"
        current_app.logger.warning("Gemini medicine extraction failed (%s)", result)
        return None, result


@lru_cache(maxsize=1)
def _medicine_name_index() -> tuple[dict[str, dict[str, Any]], list[str]]:
    from app.services.chat_router import MEDICINES

    aliases: dict[str, dict[str, Any]] = {}
    for record in MEDICINES:
        for value in [record.get("name", ""), *record.get("substitutes", [])]:
            normalized = _normalized(str(value))
            if normalized:
                aliases.setdefault(normalized, record)
    return aliases, list(aliases)


def _find_verified_record(brand: str | None) -> tuple[dict[str, Any] | None, float]:
    if not brand:
        return None, 0.0
    # This is the same reference dataset already used by Elixora's medicine lookup.
    aliases, names = _medicine_name_index()
    normalized_brand = _normalized(brand)
    if normalized_brand in aliases:
        return aliases[normalized_brand], 1.0
    if process is not None:
        match = process.extractOne(normalized_brand, names)
        if not match:
            return None, 0.0
        matched_name = match[0]
        best = aliases[matched_name]
        # WRatio is useful for candidate retrieval but can overrate partial word
        # matches. Verify with strict normalized similarity before accepting.
        best_score = _similarity(normalized_brand, matched_name)
    else:
        best_name = max(names, key=lambda name: SequenceMatcher(None, normalized_brand, name).ratio(), default="")
        best, best_score = aliases.get(best_name), SequenceMatcher(None, normalized_brand, best_name).ratio()
    return (best, best_score) if best_score >= 0.88 else (None, best_score)


def analyze_medicine_image(image_bytes: bytes, mime_type: str) -> dict[str, Any]:
    """Extract label text, then verify the brand against Elixora's medicine CSV."""
    extracted, service_status = _extract_with_gemini(image_bytes, mime_type)
    if extracted is None:
        return {"status": service_status, "extraction": None, "verified_record": None}

    record, score = _find_verified_record(extracted.get("brand_name"))
    if record:
        verified_record = {
            "medicine": record["name"],
            "uses": record.get("uses", []),
            "side_effects": record.get("side_effects", []),
            "reference": "Elixora medicine dataset",
            "match_score": round(score, 4),
        }
    else:
        verified_record = None
    return {"status": "ok", "extraction": extracted, "verified_record": verified_record}
