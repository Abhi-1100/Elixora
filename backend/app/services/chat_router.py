"""Offline intent routing and small data indexes for the unified chat endpoint."""

from __future__ import annotations

import csv
import json
import re
from collections import Counter, defaultdict
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any

try:
    from thefuzz import fuzz
except ImportError:  # pragma: no cover - requirements.txt includes thefuzz
    fuzz = None


PROJECT_ROOT = Path(__file__).resolve().parents[3]
SYMPTOM_CSV = PROJECT_ROOT / "dataset" / "Symptom" / "dataset.csv"
MEDICINE_CSV = PROJECT_ROOT / "dataset" / "medicine" / "medicine_dataset.csv"
MULTILANG_INFO = PROJECT_ROOT / "ml" / "i18n" / "disease_info_multilang.json"
SYMPTOM_LABELS = PROJECT_ROOT / "ml" / "i18n" / "symptom_labels.json"

SUPPORTED_LANGS = {"en", "hi", "gu"}

ROMAN_HI_STRONG = {"mujhe", "mera", "meri", "hai", "hain", "ho raha", "nahi", "kya", "aur", "se", "batao", "bataiye", "lakshan", "ilaj", "bimari"}
ROMAN_HI_SYMPTOMS = {"bukhar", "sir dard", "sar dard", "khansi", "khasi", "ulti", "dast", "pet dard", "thakan", "kamzori", "chakkar", "khujli", "dard", "gala", "sans", "seene", "ghabrahat", "neend", "bhookh", "pyas", "peshab"}
ROMAN_GU = {"mane", "che", "chhe", "tav", "mathu dukhe", "mathanu dard", "udhras", "ulti", "jhada", "pet dukhe", "thaak", "chakkar", "khanj", "shwas", "chhati", "shu", "batavo", "lakshano", "bimari"}

def detect_language(message: str, selected_lang: str = "en") -> str:
    text = _clean(message)
    if re.search(r"[\u0900-\u097f]", text):
        return "hi"
    if re.search(r"[\u0a80-\u0aff]", text):
        return "gu"
    gu_hits = sum(1 for token in ROMAN_GU if re.search(rf"(?<!\w){re.escape(token)}(?!\w)", text))
    if gu_hits >= 2 or any(token in text for token in ("tav", "mathu dukhe", "mathanu dard", "jhada")):
        return "gu"
    hi_hits = sum(1 for token in ROMAN_HI_STRONG | ROMAN_HI_SYMPTOMS if re.search(rf"(?<!\w){re.escape(token)}(?!\w)", text))
    if hi_hits >= 2 or (hi_hits >= 1 and any(token in text for token in ROMAN_HI_SYMPTOMS)):
        return "hi"
    if "namaste" in text:
        return "hi"
    return selected_lang if selected_lang in SUPPORTED_LANGS else "en"

# These are deliberately small, conservative aliases. The canonical values must
# still exist in the trained model's symptom vocabulary before they are used.
SYMPTOM_SYNONYMS = {
    "high temperature": "high_fever",
    "fever": "fever",
    "temperature": "fever",
    "loose motions": "diarrhoea",
    "loose motion": "diarrhoea",
    "throwing up": "vomiting",
    "throw up": "vomiting",
    "tired": "fatigue",
    "tiredness": "fatigue",
    "head pain": "headache",
    "peeing a lot": "polyuria",
    "frequent urination": "polyuria",
    "passing urine frequently": "polyuria",
    "bukhar": "fever",
    "sir dard": "headache",
    "सर दर्द": "headache",
    "बुखार": "fever",
    "તાવ": "fever",
    "માથાનો દુખાવો": "headache",
}

SYMPTOM_SYNONYMS.update({
    "taap": "high_fever", "tav": "high_fever", "bukhar": "high_fever",
    "sir dard": "headache", "sar dard": "headache", "mathu dukhe": "headache", "mathanu dard": "headache",
    "khansi": "cough", "khasi": "cough", "khaansi": "cough", "ulti": "vomiting", "ulta": "vomiting",
    "dast": "diarrhoea", "loose motion": "diarrhoea", "jhada": "diarrhoea",
    "pet dard": "stomach_pain", "pet dukhe": "stomach_pain", "thakan": "fatigue", "kamzori": "fatigue", "thaak": "fatigue", "kamjori": "fatigue",
    "chakkar": "dizziness", "chakkar aana": "dizziness", "khujli": "itching", "khanj": "itching",
    "gale me dard": "throat_irritation", "gala kharab": "throat_irritation",
    "sans lene me takleef": "breathlessness", "shwas ni takleef": "breathlessness",
    "zukam": "continuous_sneezing", "nazla": "runny_nose", "sardi": "continuous_sneezing",
    "body dard": "muscle_pain", "badan dard": "muscle_pain", "peshab zyada": "polyuria",
    "बुखार": "high_fever", "सिर दर्द": "headache", "खांसी": "cough", "उल्टी": "vomiting", "दस्त": "diarrhoea",
    "તાવ": "high_fever", "માથું દુખે": "headache", "ઉધરસ": "cough", "ઉલટી": "vomiting", "ઝાડા": "diarrhoea",
})

EMERGENCY_PHRASES = (
    "chest pain", "chest pressure", "can't breathe", "cannot breathe",
    "cannot breath", "shortness of breath", "breathlessness", "unconscious",
    "loss of consciousness", "severe bleeding", "heavy bleeding", "suicidal",
    "suicide", "stroke", "facial droop", "one-sided weakness", "heart attack",
    "seene me dard", "sans nahi aa rahi", "behosh", "bahut khoon", "khudkushi", "lakwa",
    "बेहोश", "सांस नहीं", "सीने में दर्द", "છાતીમાં દુખાવો",
)

GREETING_WORDS = {
    "hi", "hello", "hey", "namaste", "good morning", "good afternoon",
    "good evening", "thanks", "thank you", "thx", "શુભેચ્છા", "નમસ્તે",
}

DISEASE_CUES = (
    "symptom", "symptoms", "symptam", "symptams", "sign", "signs", "what is", "lakshan", "bimari", "diabetes ke",
    "about", "cause", "causes", "prevent", "prevention", "treatment",
    "precaution", "precautions", "how to prevent", "लक्षण", "रोकथाम",
    "ઉપચાર", "લક્ષણો",
)

COMMON_SYMPTOM_CUES = (
    "fever", "temperature", "bukhar", "sir dard", "head pain", "itching",
    "skin rash", "cough", "vomit", "tired", "fatigue", "pain",
)

DISEASE_TYPO_ALIASES = {
    "diabitis": "diabetes",
    "denge": "dengue",
    "tyfoid": "typhoid",
    "jaundis": "jaundice",
}

MEDICINE_CUES = (
    "medicine", "medication", "tablet", "drug", "used for", "side effect",
    "side effects", "substitute", "paracetamol", "दवा", "દવા",
)


def _clean(value: Any) -> str:
    return " ".join(str(value or "").strip().lower().replace("_", " ").split())


def _read_disease_data() -> tuple[dict[str, list[str]], dict[str, str]]:
    frequencies: dict[str, Counter[str]] = defaultdict(Counter)
    if SYMPTOM_CSV.exists():
        with SYMPTOM_CSV.open(newline="", encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                disease = _clean(row.get("Disease"))
                if not disease:
                    continue
                for key, value in row.items():
                    if key.lower().startswith("symptom_"):
                        symptom = _clean(value)
                        if symptom:
                            frequencies[disease][symptom] += 1

    typical = {
        disease: [symptom for symptom, _ in counts.most_common(8)]
        for disease, counts in frequencies.items()
    }
    info: dict[str, str] = {}
    if MULTILANG_INFO.exists():
        try:
            raw = json.loads(MULTILANG_INFO.read_text(encoding="utf-8"))
            for key in raw:
                info[_clean(key)] = key
        except (OSError, json.JSONDecodeError):
            pass
    return typical, info


def _read_medicine_data() -> list[dict[str, Any]]:
    medicines: list[dict[str, Any]] = []
    if not MEDICINE_CSV.exists():
        return medicines
    with MEDICINE_CSV.open(newline="", encoding="utf-8-sig") as handle:
        for row in csv.DictReader(handle):
            name = str(row.get("name") or "").strip()
            if not name:
                continue
            uses = [str(row.get(f"use{i}") or "").strip() for i in range(5)]
            side_effects = [str(row.get(f"sideEffect{i}") or "").strip() for i in range(42)]
            substitutes = [str(row.get(f"substitute{i}") or "").strip() for i in range(5)]
            medicines.append({
                "name": name,
                "uses": [value for value in uses if value],
                "side_effects": [value for value in side_effects if value],
                "substitutes": [value for value in substitutes if value],
            })
    return medicines


TYPICAL_SYMPTOMS, DISEASE_KEYS = _read_disease_data()
MEDICINES = _read_medicine_data()
try:
    UI_STRINGS = json.loads((PROJECT_ROOT / "ml" / "i18n" / "ui_strings.json").read_text(encoding="utf-8"))
except (OSError, json.JSONDecodeError):
    UI_STRINGS = {}


def chat_string(lang: str, key: str, **values: Any) -> str:
    """Return a localized template while keeping the route safe if a key is absent."""
    language = lang if lang in SUPPORTED_LANGS else "en"
    template = UI_STRINGS.get(language, {}).get(key) or UI_STRINGS.get("en", {}).get(key) or ""
    if isinstance(template, list):
        return template
    return template.format(**values) if template else ""


def label(key: str, lang: str = "en") -> str:
    """Translate a model symptom key without ever failing the response."""
    try:
        data = json.loads(SYMPTOM_LABELS.read_text(encoding="utf-8"))
        entry = data.get(str(key), {})
        return entry.get(lang) or entry.get("en") or str(key).replace("_", " ").title()
    except (OSError, json.JSONDecodeError, AttributeError):
        return str(key).replace("_", " ").title()


def _similarity(left: str, right: str) -> float:
    if fuzz is not None:
        return float(max(fuzz.ratio(left, right), fuzz.WRatio(left, right)))
    return SequenceMatcher(None, left, right).ratio() * 100


def _message_candidates(message: str, width: int = 1) -> list[str]:
    words = re.findall(r"[\w'-]+", _clean(message), flags=re.UNICODE)
    return [" ".join(words[index:index + width]) for index in range(len(words) - width + 1)]


def match_disease(message: str) -> str | None:
    """Return the canonical dataset disease key, allowing small typos."""
    if not TYPICAL_SYMPTOMS:
        return None
    normalized_message = _clean(message)
    for typo, disease in DISEASE_TYPO_ALIASES.items():
        if re.search(rf"(?<!\w){re.escape(typo)}(?!\w)", normalized_message) and disease in TYPICAL_SYMPTOMS:
            return disease
    best_key: str | None = None
    best_score = 0.0
    for key in TYPICAL_SYMPTOMS:
        disease_words = len(key.split())
        candidates = _message_candidates(message, disease_words)
        candidates.extend([_clean(message)])
        for candidate in candidates:
            score = _similarity(candidate, key)
            if key in candidate:
                score = max(score, 100.0)
            if score > best_score:
                best_key, best_score = key, score
    return best_key if best_score >= 80 else None


def match_medicine(message: str) -> dict[str, Any] | None:
    best: dict[str, Any] | None = None
    best_score = 0.0
    text = _clean(message)
    content_words = [word for word in re.findall(r"[\w'-]+", text, flags=re.UNICODE)
                     if len(word) >= 4 and word not in {"what", "which", "used", "with", "from", "medicine", "tablet", "side", "effects"}]
    for medicine in MEDICINES:
        name = _clean(medicine["name"])
        if name in text or any(word in name for word in content_words):
            score = 100.0
        else:
            # Compare short message windows so “what is paracetamol used for”
            # can match a longer CSV name such as “paracetamol 500mg tablet”.
            candidates = [" ".join(content_words[index:index + width])
                          for width in (1, 2, 3, 4)
                          for index in range(max(0, len(content_words) - width + 1))]
            score = max((_similarity(candidate, name) for candidate in candidates), default=0.0)
        if score > best_score:
            best, best_score = medicine, score
    return best if best_score >= 72 else None


def _has_disease_cue(message: str) -> bool:
    text = _clean(message)
    return any(cue in text for cue in DISEASE_CUES)


def classify_intent(message: str) -> str:
    text = _clean(message)
    if any(phrase in text for phrase in EMERGENCY_PHRASES):
        return "emergency"
    if not text:
        return "unknown"
    if text in GREETING_WORDS or len(text.split()) <= 3 and any(word in GREETING_WORDS for word in text.split()):
        return "greeting"
    if any(cue in text for cue in MEDICINE_CUES):
        return "medicine_info"
    if match_disease(text) and _has_disease_cue(text):
        return "disease_info"
    if any(_clean(alias) in text for alias in SYMPTOM_SYNONYMS) or any(cue in text for cue in COMMON_SYMPTOM_CUES):
        return "symptom_check"
    return "symptom_check" if any(word in text for word in ("fever", "cough", "pain", "rash", "vomit", "headache")) else "unknown"


def extract_symptoms(message: str, known_symptoms: tuple[str, ...] | list[str]) -> list[str]:
    """Exact matching, aliases, then conservative fuzzy matching."""
    text = _clean(message)
    normalized_known = {_clean(symptom): symptom for symptom in known_symptoms}
    alias_targets = {
        "fever": ("fever", "high fever"),
        "diarrhoea": ("diarrhoea", "diarrhea"),
    }
    for alias, canonical in sorted(SYMPTOM_SYNONYMS.items(), key=lambda item: len(item[0]), reverse=True):
        targets = alias_targets.get(canonical, (canonical.replace("_", " "), canonical))
        resolved = next((target for target in targets if _clean(target) in normalized_known), canonical)
        text = re.sub(rf"(?<!\w){re.escape(_clean(alias))}(?!\w)", _clean(resolved), text, flags=re.IGNORECASE)
    matches: list[str] = []
    for normalized, canonical in normalized_known.items():
        if re.search(rf"(?<!\w){re.escape(normalized)}(?!\w)", text):
            matches.append(canonical)

    if fuzz is not None:
        words = re.findall(r"[\w'-]+", text, flags=re.UNICODE)
        for normalized, canonical in normalized_known.items():
            if canonical in matches:
                continue
            width = len(normalized.split())
            for start in range(max(0, len(words) - width + 1)):
                candidate = " ".join(words[start:start + width])
                if fuzz.ratio(candidate, normalized) >= 90:
                    matches.append(canonical)
                    break
    return list(dict.fromkeys(matches))


def readable_symptom(symptom: str) -> str:
    return symptom.replace("_", " ").strip().lower()


def disease_info(disease: str, lang: str = "en") -> dict[str, Any]:
    canonical_key = DISEASE_KEYS.get(disease, disease)
    info: dict[str, Any] = {}
    if MULTILANG_INFO.exists():
        try:
            raw = json.loads(MULTILANG_INFO.read_text(encoding="utf-8"))
            info = raw.get(canonical_key, {}).get(lang) or raw.get(canonical_key, {}).get("en") or {}
        except (OSError, json.JSONDecodeError):
            info = {}
    return {
        "name": info.get("name") or disease.title(),
        "description": info.get("description") or "This is a possible condition described by the local health dataset.",
        "precautions": info.get("precautions") or [],
        "symptoms": [readable_symptom(value) for value in TYPICAL_SYMPTOMS.get(disease, [])],
    }
