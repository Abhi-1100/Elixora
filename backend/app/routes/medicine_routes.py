import os
from io import BytesIO

import requests
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from PIL import Image, ImageOps, UnidentifiedImageError
from pillow_heif import register_heif_opener

from app.services.gemini_medicine import _similarity, analyze_medicine_image

medicine_bp = Blueprint("medicine_bp", __name__)
register_heif_opener()
ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".jpe", ".jfif", ".png", ".bmp", ".dib", ".webp",
    ".tif", ".tiff", ".gif", ".heic", ".heif", ".avif",
}
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG", "BMP", "WEBP", "TIFF", "GIF", "HEIF", "AVIF"}
MAX_FILE_SIZE = 10 * 1024 * 1024


def _normalize_image(contents: bytes, filename: str) -> tuple[bytes, str]:
    """Validate an uploaded image and encode it as JPEG for both analyzers."""
    extension = os.path.splitext(filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("unsupported extension")
    try:
        with Image.open(BytesIO(contents)) as source:
            if source.format not in ALLOWED_IMAGE_FORMATS:
                raise ValueError("unsupported image format")
            source.seek(0)
            image = ImageOps.exif_transpose(source)
            if "A" in image.getbands():
                rgba = image.convert("RGBA")
                image = Image.new("RGB", rgba.size, "white")
                image.paste(rgba, mask=rgba.getchannel("A"))
            else:
                image = image.convert("RGB")
            encoded = BytesIO()
            image.save(encoded, format="JPEG", quality=92, optimize=True)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError) as error:
        raise ValueError("unreadable image") from error
    return encoded.getvalue(), os.path.splitext(os.path.basename(filename))[0] + ".jpg"


@medicine_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_medicine():
    if not get_jwt_identity():
        return jsonify({"error": "Authentication required."}), 401

    image = request.files.get("file")
    if image is None or not image.filename:
        return jsonify({"error": "Choose a medicine image to analyze."}), 400

    contents = image.read(MAX_FILE_SIZE + 1)
    if not contents:
        return jsonify({"error": "The selected image is empty."}), 400
    if len(contents) > MAX_FILE_SIZE:
        return jsonify({"error": "Image size must be under 10 MB."}), 400
    try:
        contents, normalized_filename = _normalize_image(contents, image.filename)
    except ValueError:
        return jsonify({
            "error": (
                "Unsupported or unreadable image. Use JPG, PNG, WEBP, BMP, TIFF, "
                "GIF, HEIC, HEIF, or AVIF."
            )
        }), 400

    api_url = os.getenv("MEDICINE_AI_API_URL", "http://127.0.0.1:8000").rstrip("/")
    timeout = float(os.getenv("MEDICINE_AI_TIMEOUT_SECONDS", "120"))
    legacy_result = None
    legacy_error = None
    try:
        response = requests.post(
            f"{api_url}/predict",
            files={"file": (normalized_filename, contents, "image/jpeg")},
            timeout=(5, timeout),
        )
    except requests.Timeout:
        current_app.logger.warning("Medicine AI request timed out")
        legacy_error = ("Medicine analysis timed out. Please try again.", 504)
    except requests.RequestException:
        current_app.logger.warning("Medicine AI service is unavailable", exc_info=True)
        legacy_error = ("Medicine Analyzer is temporarily unavailable. Please try again later.", 503)
    else:
        try:
            result = response.json()
        except ValueError:
            current_app.logger.error("Medicine AI returned a non-JSON response (%s)", response.status_code)
            legacy_error = ("Medicine analysis returned an invalid response. Please try again.", 502)
        else:
            if not response.ok:
                detail = result.get("detail") if isinstance(result, dict) else None
                legacy_error = (detail or "Medicine analysis failed. Please try a valid, clear image.", response.status_code)
            elif not isinstance(result, dict) or result.get("status") not in {"identified", "uncertain"}:
                current_app.logger.error("Medicine AI returned an unexpected response shape")
                legacy_error = ("Medicine analysis returned an unexpected response. Please try again.", 502)
            else:
                legacy_result = result

    gemini = analyze_medicine_image(contents, "image/jpeg")
    if legacy_result is None and gemini.get("verified_record") is None:
        message, status_code = legacy_error or ("Medicine analysis is temporarily unavailable. Please try again later.", 503)
        if gemini["status"] == "invalid_key":
            message = "Gemini is not configured correctly. The existing medicine analyzer is temporarily unavailable."
        elif gemini["status"] == "rate_limited":
            message = "Medicine analysis is busy. Please try again shortly."
        elif gemini["status"] == "timeout":
            message = "Medicine analysis timed out. Please try again."
        return jsonify({"error": message, "gemini_status": gemini["status"]}), status_code

    result = legacy_result or {"status": "uncertain", "candidates": []}
    result["gemini_status"] = gemini["status"]
    extraction = gemini.get("extraction")
    verified = gemini.get("verified_record")
    if extraction:
        result["gemini_extraction"] = extraction

    if verified and result.get("status") == "uncertain":
        uses = verified["uses"]
        result.update({
            "status": "identified",
            "medicine": verified["medicine"],
            "identification_source": "gemini",
            "medicine_info": {
                "medicineName": verified["medicine"],
                "activeIngredients": extraction["active_ingredients"],
                "strength": extraction["strength"],
                "commonUses": ", ".join(uses) if uses else None,
                "doseInformation": None,
                "ageInformation": None,
                "foodInstructions": None,
                "sideEffects": verified["side_effects"],
                "reference": verified["reference"],
            },
            "verification": {
                "source": verified["reference"],
                "brand_match_score": verified["match_score"],
                "active_ingredients_source": "package label image; not independently listed in the reference dataset",
            },
        })
        result.pop("candidates", None)
    elif verified and result.get("status") == "identified":
        existing_name = result.get("medicine") or (result.get("medicine_info") or {}).get("medicineName")
        if existing_name and _similarity(str(existing_name), extraction.get("brand_name") or verified["medicine"]) < 0.66:
            existing_candidate = {
                "medicine": existing_name,
                "source": result.get("identification_source") or "model",
                "medicine_info": result.get("medicine_info"),
                "evidence": "Existing image/OCR analysis result; it disagrees with the package text read by Gemini.",
            }
            gemini_candidate = {
                "medicine": verified["medicine"],
                "source": "gemini",
                "score": verified["match_score"],
                "evidence": "Package brand matched Elixora's medicine reference dataset.",
                "medicine_info": {
                    "medicineName": verified["medicine"],
                    "activeIngredients": extraction["active_ingredients"],
                    "commonUses": ", ".join(verified["uses"]) if verified["uses"] else None,
                    "sideEffects": verified["side_effects"],
                    "reference": verified["reference"],
                },
            }
            result.update({
                "status": "uncertain",
                "message": "The package text and image/OCR analysis suggest different medicines. Confirm the printed name before using this reference.",
                "candidates": [gemini_candidate, existing_candidate],
            })
        elif isinstance(result.get("medicine_info"), dict):
            result["medicine_info"].update({
                "activeIngredients": extraction["active_ingredients"],
                "strength": extraction["strength"],
                "reference": verified["reference"],
            })
            result["verification"] = {
                "source": verified["reference"],
                "brand_match_score": verified["match_score"],
                "active_ingredients_source": "package label image; not independently listed in the reference dataset",
            }
    elif extraction and not verified and result.get("status") == "uncertain":
        brand = extraction.get("brand_name")
        if brand:
            candidates = result.setdefault("candidates", [])
            if not any(candidate.get("medicine", "").casefold() == brand.casefold() for candidate in candidates):
                candidates.insert(0, {
                    "medicine": brand,
                    "source": "gemini",
                    "evidence": "Name read from package image; not verified in Elixora's reference dataset.",
                })
        result["message"] = "The package text was read, but its medicine name could not be verified in Elixora's reference dataset. Confirm the label or upload a clearer image."

    return jsonify(result), 200
