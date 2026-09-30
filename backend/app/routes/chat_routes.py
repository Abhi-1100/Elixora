"""Symptom-advisor endpoint backed by the local classifier and an LLM."""

import json
import importlib.util
import os
import re
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

from flask import Blueprint, current_app, jsonify, request

from app.services.symptom_predictor import get_symptom_predictor
from app.services.chat_router import (
    chat_string,
    classify_intent,
    disease_info,
    extract_symptoms,
    match_disease,
    match_medicine,
)

try:
    from thefuzz import fuzz
except ImportError:
    fuzz = None

chat_bp = Blueprint("chat_bp", __name__)


def init_multilang_predictor(app) -> None:
    """Load the project-root multilingual predictor once at app startup."""
    project_root = Path(app.root_path).resolve().parents[1]
    module_path = project_root / "ml" / "predict_multilang.py"
    if not module_path.is_file():
        app.logger.warning("Multilingual predictor not found at %s", module_path)
        app.extensions["multilang_predictor"] = None
        return

    spec = importlib.util.spec_from_file_location("predict_multilang", module_path)
    if spec is None or spec.loader is None:
        app.logger.warning("Unable to load multilingual predictor from %s", module_path)
        app.extensions["multilang_predictor"] = None
        return
    module = importlib.util.module_from_spec(spec)
    try:
        spec.loader.exec_module(module)
    except (OSError, ImportError, ValueError) as error:
        app.logger.exception("Multilingual predictor initialization failed: %s", error)
        app.extensions["multilang_predictor"] = None
        return
    app.extensions["multilang_predictor"] = module


def _multilang_predictor():
    """Return the predictor module loaded during Flask app initialization."""
    return current_app.extensions.get("multilang_predictor")


def _normalized(value):
    return " ".join(str(value).lower().replace("_", " ").split())


def extract_symptoms(message, known_symptoms):
    """Exact phrase matching first, then conservative fuzzy token-window matching."""
    text = _normalized(message)
    matches = []
    for symptom in known_symptoms:
        if re.search(r"(?<!\w)" + re.escape(_normalized(symptom)) + r"(?!\w)", text):
            matches.append(symptom)
    if fuzz is None:
        return matches
    words = re.findall(r"[a-z]+", text)
    for symptom in known_symptoms:
        if symptom in matches:
            continue
        target = _normalized(symptom)
        width = len(target.split())
        for start in range(max(0, len(words) - width + 1)):
            if fuzz.ratio(" ".join(words[start:start + width]), target) >= 90:
                matches.append(symptom)
                break
    return matches


def _urgency_for(symptoms):
    text = " ".join(_normalized(symptom) for symptom in symptoms)
    if any(item in text for item in ("chest pain", "breathlessness", "loss of consciousness", "coma")):
        return "emergency"
    if any(item in text for item in ("high fever", "vomiting", "severe", "blood")):
        return "seek_care_soon"
    return "routine"


def _fallback_response(predictions, urgency):
    if predictions:
        lead = f"Your symptom pattern has been matched with {predictions[0]['disease']} as one possible condition."
    else:
        lead = "I could not confidently match your message to symptoms in this model."
    advice = {
        "emergency": "Please seek emergency care now, especially if symptoms are sudden or worsening.",
        "seek_care_soon": "Please arrange prompt medical evaluation, especially if symptoms worsen, persist, or you cannot keep fluids down.",
        "routine": "This is not a diagnosis; consider speaking with a clinician if symptoms persist or concern you.",
    }[urgency]
    return f"{lead} {advice}"


def _llm_response(message, prediction_data, urgency):
    """Call an OpenAI-compatible API when configured; otherwise return safe fallback text."""
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("LLM_API_KEY")
    if not api_key:
        return _fallback_response(prediction_data["predictions"], urgency), "local_fallback"
    prompt = (
        "You are a cautious health-information assistant, not a diagnosing clinician. "
        "Give a conversational explanation, state the urgency level, and safe next steps. "
        "Treat ML predictions only as possible conditions, never confirmed diagnoses.\n\n"
        f"Patient message: {message}\nMatched symptoms: {prediction_data['recognized_symptoms']}\n"
        f"ML predictions: {prediction_data['predictions']}\nUrgency: {urgency}"
    )
    payload = json.dumps({"model": os.getenv("LLM_MODEL", "gpt-4o-mini"), "messages": [{"role": "user", "content": prompt}], "temperature": 0.3}).encode()
    try:
        req = Request(os.getenv("LLM_API_URL", "https://api.openai.com/v1/chat/completions"), data=payload, headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"})
        with urlopen(req, timeout=20) as response:
            data = json.loads(response.read().decode())
        return data["choices"][0]["message"]["content"].strip(), "llm"
    except (URLError, KeyError, IndexError, ValueError) as error:
        current_app.logger.warning("LLM request failed: %s", error)
        return _fallback_response(prediction_data["predictions"], urgency), "local_fallback"


@chat_bp.post("/symptom-advisor")
def symptom_advisor():
    body = request.get_json(silent=True) or {}
    message = str(body.get("message", "")).strip()
    if not message:
        return jsonify({"error": "A non-empty 'message' is required."}), 400
    predictor = get_symptom_predictor(current_app)
    if predictor is None:
        return jsonify({"error": "The symptom prediction model is not available yet."}), 503
    supplied = body.get("symptoms")
    if supplied is not None and not isinstance(supplied, list):
        return jsonify({"error": "'symptoms' must be a list when supplied."}), 400
    candidates = supplied if supplied is not None else extract_symptoms(message, predictor.known_symptoms)
    prediction_data = predictor.predict_disease(candidates, top_n=3)
    urgency = _urgency_for(prediction_data["recognized_symptoms"])
    response, source = _llm_response(message, prediction_data, urgency)
    return jsonify({
        "matched_symptoms": prediction_data["recognized_symptoms"],
        "unrecognized_symptoms": prediction_data["unrecognized_symptoms"],
        "predictions": prediction_data["predictions"],
        "urgency_level": urgency,
        "response": response,
        "response_source": source,
    })


@chat_bp.post("/symptom-check")
def symptom_check():
    """Return a localized response from the multilingual ML predictor."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "A JSON request body is required."}), 400

    symptoms = body.get("symptoms")
    if isinstance(symptoms, str):
        if not symptoms.strip():
            return jsonify({"error": "'symptoms' must not be empty."}), 400
    elif isinstance(symptoms, list):
        if not symptoms or not all(isinstance(symptom, str) and symptom.strip() for symptom in symptoms):
            return jsonify({"error": "'symptoms' must be a non-empty string list."}), 400
    else:
        return jsonify({"error": "'symptoms' must be a string or list of strings."}), 400

    lang = body.get("lang", "en")
    if lang not in {"en", "hi", "gu"}:
        return jsonify({"error": "'lang' must be one of: en, hi, gu."}), 400

    predictor = _multilang_predictor()
    if predictor is None:
        return jsonify({"error": "The multilingual symptom prediction model is unavailable."}), 503
    prediction = predictor.predict_disease(symptoms)
    response = predictor.format_response(prediction, lang=lang)

    return jsonify(response)


def _chat_disclaimer(lang: str) -> str:
    return chat_string(lang, "disclaimer") or "AI guidance only. Not a medical diagnosis. Consult a physician for emergencies."


def _chat_emergency(lang: str) -> str:
    return chat_string(lang, "chat_emergency")


def _chat_disease_response(disease: str, lang: str) -> str:
    info = disease_info(disease, lang)
    symptoms = ", ".join(info["symptoms"]) or "No typical symptoms were available in the dataset"
    precautions = ", ".join(info["precautions"]) or "speak with a qualified clinician for individualized advice"
    parts = [
        chat_string(lang, "chat_disease_intro", name=info["name"], description=info["description"]),
        chat_string(lang, "chat_disease_symptoms", symptoms=symptoms),
        chat_string(lang, "chat_disease_precautions", precautions=precautions),
        _chat_disclaimer(lang),
    ]
    return "\n\n".join(part for part in parts if part)


def _chat_medicine_response(message: str, lang: str) -> str:
    medicine = match_medicine(message)
    if not medicine:
        return (
            "I could not find that medicine in the local medicine dataset. Please check the spelling or ask a pharmacist.\n\n"
            + _chat_disclaimer(lang)
        )
    values = {
        "name": medicine["name"],
        "uses": ", ".join(medicine["uses"]) or "not listed",
        "side_effects": ", ".join(medicine["side_effects"]) or "not listed",
        "substitutes": ", ".join(medicine["substitutes"]) or "not listed",
    }
    parts = [
        chat_string(lang, "chat_medicine_intro", name=values["name"]),
        chat_string(lang, "chat_medicine_uses", values=values["uses"]),
        chat_string(lang, "chat_medicine_side_effects", values=values["side_effects"]),
        chat_string(lang, "chat_medicine_substitutes", values=values["substitutes"]),
        _chat_disclaimer(lang),
    ]
    return "\n\n".join(part for part in parts if part)


def _chat_symptom_response(message: str, lang: str, predictor) -> tuple[str, dict]:
    candidates = extract_symptoms(message, predictor.known_symptoms)
    # The public model vocabulary commonly contains high_fever rather than the
    # shorter natural-language phrase “fever”; keep this demo input reliable.
    if re.search(r"(?<!\w)fever(?!\w)", message.lower()):
        fever = predictor.normalize_known_symptom("high_fever") or predictor.normalize_known_symptom("fever")
        if fever and fever not in candidates:
            candidates.append(fever)
    lower_message = message.lower()
    for phrase, symptom in (("high temperature", "high_fever"), ("temperature", "fever"),
                            ("bukhar", "fever"), ("sir dard", "headache"), ("head pain", "headache")):
        if phrase in lower_message:
            canonical = predictor.normalize_known_symptom(symptom)
            if not canonical and symptom == "fever":
                canonical = predictor.normalize_known_symptom("high_fever")
            if canonical and canonical not in candidates:
                candidates.append(canonical)
    prediction_data = predictor.predict_disease(candidates, top_n=3)
    recognized = prediction_data["recognized_symptoms"]
    if not recognized or not prediction_data["predictions"]:
        return chat_string(lang, "chat_followup"), {"matched_symptoms": []}

    urgency = _urgency_for(recognized)
    prediction_list = prediction_data["predictions"]
    prediction_text = ", ".join(
        f"{item['disease']} ({round(float(item['confidence']) * 100, 1)}%)"
        for item in prediction_list
    )
    text = chat_string(lang, "chat_symptom_intro", predictions=prediction_text)
    text = f"{text}\n\nMatched symptoms: {', '.join(recognized)}.\n\n{_chat_disclaimer(lang)}"
    return text, {
        "matched_symptoms": recognized,
        "predictions": prediction_list,
        "confidence": prediction_list[0].get("confidence"),
        "urgency": urgency,
    }


@chat_bp.post("/message")
def chat_message():
    """Unified offline-first chat route used by the main chat page."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Please send a JSON object with a non-empty message."}), 400

    message = str(body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Please enter a message so I can help."}), 400
    lang = body.get("lang", "en")
    if lang not in {"en", "hi", "gu"}:
        return jsonify({"error": "'lang' must be one of: en, hi, gu."}), 400

    intent = classify_intent(message)
    if intent == "emergency":
        return jsonify({"intent": intent, "text": _chat_emergency(lang), "urgency": "emergency"})
    if intent == "greeting":
        return jsonify({"intent": intent, "text": chat_string(lang, "chat_greeting")})
    if intent == "disease_info":
        disease = match_disease(message)
        if disease:
            return jsonify({"intent": intent, "text": _chat_disease_response(disease, lang), "disease": disease})
    if intent == "medicine_info":
        medicine = match_medicine(message)
        return jsonify({"intent": intent, "text": _chat_medicine_response(message, lang), "medicine": medicine["name"] if medicine else None})
    if intent == "symptom_check":
        predictor = get_symptom_predictor(current_app)
        if predictor is not None:
            text, details = _chat_symptom_response(message, lang, predictor)
            if details.get("matched_symptoms"):
                return jsonify({"intent": intent, "text": text, **details})

    return jsonify({"intent": "unknown", "text": chat_string(lang, "chat_followup")})
