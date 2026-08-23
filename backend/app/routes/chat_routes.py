"""Symptom-advisor endpoint backed by the local classifier and an LLM."""

import json
import os
import re
from urllib.error import URLError
from urllib.request import Request, urlopen

from flask import Blueprint, current_app, jsonify, request

from app.services.symptom_predictor import get_symptom_predictor

try:
    from thefuzz import fuzz
except ImportError:
    fuzz = None

chat_bp = Blueprint("chat_bp", __name__)


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
