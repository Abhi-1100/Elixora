"""Symptom-advisor endpoint backed by the local classifier and an LLM."""

import json
import importlib.util
import os
import re
from pathlib import Path
from urllib.error import URLError
from urllib.request import Request, urlopen

from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

from app.services.symptom_predictor import get_symptom_predictor
from app.services.translation_service import (
    TranslationNotConfiguredError,
    TranslationProviderError,
    translate_to_english,
)
from app.services.chat_router import (
    chat_string,
    detect_language,
    label,
    classify_intent,
    disease_info,
    extract_symptoms,
    match_disease,
    match_medicine,
    SYMPTOM_SYNONYMS,
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
    if supplied is not None and not all(isinstance(item, str) and item.strip() for item in supplied):
        return jsonify({"error": "'symptoms' must contain only non-empty strings."}), 400
    if supplied is not None:
        message = " ".join(str(item) for item in supplied if isinstance(item, str))
    result = _structured_symptoms(message, detect_language(message), predictor)
    return jsonify({
        "matched_symptoms": _remove_negated_symptoms(message, extract_symptoms(message, predictor.known_symptoms)),
        "response": result["text"],
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

    predictor = get_symptom_predictor(current_app)
    if predictor is None:
        return jsonify({"error": "The symptom vocabulary is unavailable."}), 503
    message = symptoms if isinstance(symptoms, str) else ", ".join(symptoms)
    return jsonify(_structured_symptoms(message, lang, predictor))


def _chat_disclaimer(lang: str) -> str:
    return chat_string(lang, "disclaimer") or "AI guidance only. Not a medical diagnosis. Consult a physician for emergencies."


def _chat_emergency(lang: str) -> str:
    return chat_string(lang, "chat_emergency")


def _symptom_self_care(symptoms, lang):
    normalized = {_normalized(symptom) for symptom in symptoms}
    has_fever = any("fever" in item for item in normalized)
    has_headache = any("headache" in item for item in normalized)
    has_gi = any(term in item for item in normalized for term in ("vomit", "diarr", "stomach"))
    tips = []
    if lang == "hi":
        if has_fever:
            tips.append("यदि संभव हो तो थर्मामीटर से तापमान मापें, आराम करें और पानी जैसे तरल लेते रहें।")
        if has_headache:
            tips.append("शांत जगह पर आराम करें और पानी पिएं।")
        if has_gi:
            tips.append("यदि उल्टी या दस्त हैं, तो पानी या ओआरएस के छोटे-छोटे घूंट लें।")
        if not tips:
            tips.append("आराम करें और लक्षणों में बदलाव पर ध्यान दें।")
        tips.append("बिना डॉक्टर या फार्मासिस्ट की सलाह के नई दवा, एंटीबायोटिक या किसी और की दवा न लें।")
    elif lang == "gu":
        if has_fever:
            tips.append("શક્ય હોય તો થર્મોમીટરથી તાપમાન માપો, આરામ કરો અને પાણી જેવા પ્રવાહી પીતા રહો.")
        if has_headache:
            tips.append("શાંત જગ્યાએ આરામ કરો અને પાણી પીવો.")
        if has_gi:
            tips.append("ઉલટી કે ઝાડા હોય તો પાણી અથવા ઓઆરએસના નાના ઘૂંટડા લો.")
        if not tips:
            tips.append("આરામ કરો અને લક્ષણોમાં ફેરફાર પર ધ્યાન રાખો.")
        tips.append("ડૉક્ટર કે ફાર્માસિસ્ટની સલાહ વિના નવી દવા, એન્ટિબાયોટિક કે બીજાની દવા ન લો.")
    else:
        if has_fever:
            tips.append("If possible, check your temperature with a thermometer. Rest and drink fluids such as water.")
        if has_headache:
            tips.append("Rest somewhere quiet and drink water.")
        if has_gi:
            tips.append("If you have vomiting or diarrhea, take small, frequent sips of water or oral rehydration solution (ORS).")
        if not tips:
            tips.append("Rest as needed and keep track of any changes in your symptoms.")
        tips.append("Do not start a new medicine, take antibiotics, or use someone else's medicine without advice from a doctor or pharmacist.")
    return tips


def _symptom_red_flags(symptoms, lang):
    normalized = {_normalized(symptom) for symptom in symptoms}
    has_fever = any("fever" in item for item in normalized)
    has_gi = any(term in item for item in normalized for term in ("vomit", "diarr", "stomach"))
    if lang == "hi":
        flags = ["सांस लेने में कठिनाई, सीने में दर्द, बेहोशी, भ्रम, दौरा, या अचानक कमजोरी/बोलने में दिक्कत हो तो अभी आपातकालीन मदद लें।"]
        if has_fever:
            flags.append("बुखार बिगड़ रहा हो, घर पर देखभाल से ठीक न हो रहा हो, या आपको बहुत अस्वस्थ महसूस हो तो डॉक्टर से संपर्क करें।")
        if has_gi:
            flags.append("पानी न रुकने, पेशाब बहुत कम होने, तेज पेट दर्द, या उल्टी/मल में खून होने पर तुरंत चिकित्सा सहायता लें।")
        flags.append("लक्षण गंभीर हों, बिगड़ें, या बने रहें तो डॉक्टर से संपर्क करें।")
        return flags
    if lang == "gu":
        flags = ["શ્વાસ લેવામાં તકલીફ, છાતીમાં દુખાવો, બેભાન થવું, ગૂંચવણ, આંચકી, અથવા અચાનક નબળાઈ/બોલવામાં તકલીફ થાય તો તાત્કાલિક ઇમરજન્સી મદદ લો."]
        if has_fever:
            flags.append("તાવ વધે, ઘરેલુ સંભાળથી સુધરે નહીં, અથવા તમને ખૂબ અસ્વસ્થ લાગે તો ડૉક્ટરનો સંપર્ક કરો.")
        if has_gi:
            flags.append("પ્રવાહી ન ટકે, પેશાબ ખૂબ ઓછો થાય, પેટમાં તીવ્ર દુખાવો હોય, અથવા ઉલટી/મળમાં લોહી હોય તો તરત તબીબી મદદ લો.")
        flags.append("લક્ષણો ગંભીર હોય, વધે, અથવા ચાલુ રહે તો ડૉક્ટરનો સંપર્ક કરો.")
        return flags
    flags = ["Get emergency help now for trouble breathing, chest pain, fainting, confusion, a seizure, or sudden weakness or trouble speaking."]
    if has_fever:
        flags.append("Contact a clinician if the fever is getting worse, is not improving with home care, or you feel very unwell.")
    if has_gi:
        flags.append("Seek prompt medical care if you cannot keep fluids down, urinate very little, have severe abdominal pain, or see blood in vomit or stool.")
    flags.append("For any symptom, contact a clinician if it is severe, worsening, or not improving.")
    return flags


def _remove_negated_symptoms(message, symptoms):
    """Do not present a symptom as present when the user explicitly denies it."""
    text = _normalized(message)
    negation = r"(?:no|not|never|without|denies|denied|don't have|do not have|doesn't have|does not have|नहीं|नही|નથી)"
    affirmed = []
    for symptom in symptoms:
        phrase = _normalized(symptom)
        surfaces = {phrase}
        if phrase in {"fever", "high fever"}:
            surfaces.update({"fever", "high fever"})
        for alias, target in SYMPTOM_SYNONYMS.items():
            normalized_target = _normalized(target)
            if normalized_target == phrase or phrase in {"fever", "high fever"} and normalized_target in {"fever", "high fever"}:
                surfaces.add(_normalized(alias))
        occurrences = [match for surface in surfaces for match in re.finditer(
            rf"(?<!\w){re.escape(surface)}(?!\w)", text
        )]
        if not occurrences:
            affirmed.append(symptom)
            continue
        has_affirmed_mention = False
        for occurrence in occurrences:
            before = text[max(0, occurrence.start() - 45):occurrence.start()]
            before = re.split(r"\b(?:but|and|however|और|અને)\b|[,;.!?]", before)[-1]
            after = text[occurrence.end():occurrence.end() + 24]
            denied_before = re.search(rf"{negation}(?:\s+\w+){{0,3}}\s*$", before)
            denied_after = re.match(r"\s*(?:is|are)?\s*(?:not present|absent|gone|नहीं(?:\s+(?:है|हैं))?|નથી)", after)
            if not denied_before and not denied_after:
                has_affirmed_mention = True
                break
        if has_affirmed_mention:
            affirmed.append(symptom)
    return affirmed


def _symptom_possible_causes(symptoms, lang):
    norm = " ".join(_normalized(s) for s in symptoms)
    causes = []
    if lang == "hi":
        if ("fever" in norm or "bukhar" in norm) and ("headache" in norm or "sir dard" in norm):
            causes.extend(["सामान्य वायरल संक्रमण (मौसमी वायरल बुखार या फ्लू)", "तनाव या साइनस सिरदर्द के साथ हल्का बुखार", "ऊपरी श्वसन तंत्र का संक्रमण"])
        elif ("fever" in norm or "bukhar" in norm) and any(term in norm for term in ("cough", "khansi")):
            causes.extend(["ऊपरी श्वसन तंत्र का वायरल संक्रमण (सर्दी-जुकाम या फ्लू)", "मौसमी एलर्जी जनित खांसी और बुखार", "तीव्र ब्रोंकाइटिस"])
        elif any(term in norm for term in ("vomit", "ulti", "diarrhoea", "dast", "stomach", "pet")):
            causes.extend(["गैस्ट्रोएंटेराइटिस (पेट का सामान्य संक्रमण)", "खान-पान में गड़बड़ी या अपच", "हल्का फूड पॉइजनिंग"])
        elif "headache" in norm or "sir dard" in norm:
            causes.extend(["तनाव सिरदर्द (स्क्रीन समय, थकान या नींद की कमी)", "निर्जलीकरण (पानी की कमी) सिरदर्द", "साइनस सिरदर्द"])
        elif "fever" in norm or "bukhar" in norm:
            causes.extend(["वायरल संक्रमण (मौसमी बुखार)", "शरीर की सामान्य प्रतिरक्षा प्रतिक्रिया"])
        else:
            causes.extend(["मौसमी स्वास्थ्य समस्या या सामान्य वायरल सिंड्रोम", "शारीरिक थकान या निर्जलीकरण"])
    elif lang == "gu":
        if ("fever" in norm or "tav" in norm) and ("headache" in norm or "mathu" in norm):
            causes.extend(["સામાન્ય વાયરલ ચેપ (મોસમી તાવ અથવા ફ્લૂ)", "તણાવ કે સાઇનસ માથાના દુખાવા સાથે તાવ", "શ્વાસનળીનો ચેપ"])
        elif ("fever" in norm or "tav" in norm) and any(term in norm for term in ("cough", "udhras")):
            causes.extend(["ઉપલા શ્વસનતંત્રનો વાયરલ ચેપ (શરદી અથવા ફ્લૂ)", "મોસમી એલર્જીક ઉધરસ", "તીવ્ર બ્રોન્કાઇટિસ"])
        elif any(term in norm for term in ("vomit", "ulti", "diarrhoea", "jhada", "pet")):
            causes.extend(["ગેસ્ટ્રોએન્ટેરાઇટિસ (પેટનો ચેપ)", "ખોરાકની અસહિષ્ણુતા કે અપચો", "હળવું ફૂડ પોઈઝનિંગ"])
        elif "headache" in norm or "mathu" in norm:
            causes.extend(["તણાવ માથાનો દુખાવો (સ્ક્રીન ટાઇમ, થાક કે ઊંઘનો અભાવ)", "ડિહાઇડ્રેશન માથાનો દુખાવો", "સાઇનસ માથાનો દુખાવો"])
        elif "fever" in norm or "tav" in norm:
            causes.extend(["વાયરલ ચેપ (મોસમી તાવ)", "શરીરની રોગપ્રતિકારક પ્રતિક્રિયા"])
        else:
            causes.extend(["મોસમી સામાન્ય ચેપ", "શારીરિક થાક કે ડિહાઇડ્રેશન"])
    else:
        if "fever" in norm and "headache" in norm:
            causes.extend([
                "Common viral infection (such as seasonal flu or viral syndrome)",
                "Tension or sinus headache associated with mild fever",
                "Early upper respiratory infection",
            ])
        elif "fever" in norm and any(term in norm for term in ("cough", "throat", "sneeze")):
            causes.extend([
                "Viral upper respiratory tract infection (common cold or influenza)",
                "Seasonal allergic respiratory reaction with low-grade fever",
                "Acute bronchitis or pharyngitis",
            ])
        elif any(term in norm for term in ("vomit", "diarrhoea", "diarrhea", "stomach")):
            causes.extend([
                "Acute gastroenteritis (stomach infection or foodborne bug)",
                "Dietary indiscretion or food intolerance",
                "Indigestion or gastritis",
            ])
        elif "headache" in norm:
            causes.extend([
                "Tension-type headache (related to stress, eye strain, or screen time)",
                "Dehydration-related headache",
                "Sinus congestion headache",
            ])
        elif "fever" in norm:
            causes.extend([
                "Viral infection (such as seasonal viral fever)",
                "Immune response to an everyday infection",
            ])
        else:
            causes.extend([
                "Mild seasonal infection or viral syndrome",
                "Physical fatigue, strain, or dehydration",
            ])
    return causes


def _symptom_follow_ups(symptoms, lang):
    names = ", ".join(label(item, lang) for item in symptoms)
    if lang == "hi":
        return f"इन लक्षणों के बारे में बेहतर मार्गदर्शन के लिए बताएं: {names or 'आपको क्या परेशानी है'} कब से हैं, कितने गंभीर हैं, और क्या वे बिगड़ रहे हैं?"
    if lang == "gu":
        return f"વધુ યોગ્ય માર્ગદર્શન માટે કહો: {names or 'તમને શું તકલીફ છે'} ક્યારથી છે, કેટલા ગંભીર છે અને શું તે વધી રહ્યા છે?"
    return f"To guide you better, how long have {names or 'these symptoms'} been happening, how severe are they, and are they getting worse?"


def _chat_disease_response(disease: str, lang: str) -> str:
    info = disease_info(disease, lang)
    precautions = ", ".join(info["precautions"][:4]) or "speak with a qualified clinician for individualized advice"
    parts = [
        chat_string(lang, "chat_disease_intro", name=info["name"], description=info["description"]),
        f"General precautions: {precautions}.",
        "Note: These are educational details from clinical references, not a diagnosis for your symptoms. If you feel unwell, consult a doctor.",
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
        "uses": ", ".join(medicine["uses"][:3]) or "Not listed in the available medicine data.",
        "side_effects": ", ".join(medicine["side_effects"][:3]) or "Not listed in the available medicine data.",
    }
    safety_note = chat_string(lang, "medicine_safety_warning") or (
        "Medicine Safety Notice: Always consult a licensed physician or pharmacist before starting, changing, or stopping any medication. Never self-prescribe antibiotics or alter dosages without clinical guidance."
    )
    parts = [
        chat_string(lang, "chat_medicine_intro", name=values["name"]),
        chat_string(lang, "chat_medicine_uses", values=values["uses"]),
        chat_string(lang, "chat_medicine_side_effects", values=values["side_effects"]),
        safety_note,
        _chat_disclaimer(lang),
    ]
    return "\n\n".join(part for part in parts if part)


def _chat_symptom_response(message: str, lang: str, predictor) -> tuple[str, dict]:
    result = _structured_symptoms(message, lang, predictor)
    return result["text"], {
        "matched_symptoms": _remove_negated_symptoms(
            message, extract_symptoms(message, predictor.known_symptoms)
        ),
    }


def _section(heading, kind, items):
    return {"heading": heading, "type": kind, "items": items}


def _structured(intent, lang, title, summary, sections=None, urgency=None, follow_up=None):
    response = {"intent": intent, "lang": lang, "title": title, "summary": summary,
                "sections": sections or [], "disclaimer": _chat_disclaimer(lang)}
    if urgency:
        response["urgency"] = urgency
    if follow_up:
        response["follow_up"] = follow_up
    text_parts = [title, summary]
    for section in response["sections"]:
        text_parts.append(f"{section['heading']}:\n" + "\n".join(f"• {item.get('name')} ({item.get('confidence')}%)" if isinstance(item, dict) and "confidence" in item else f"• {item.get('name')}" if isinstance(item, dict) else f"• {item}" for item in section["items"]))
    if follow_up:
        text_parts.append(follow_up)
    text_parts.append(response["disclaimer"])
    response["text"] = "\n\n".join(part for part in text_parts if part)
    return response


def _structured_symptoms(message, lang, predictor):
    recognized = _remove_negated_symptoms(
        message, extract_symptoms(message, predictor.known_symptoms)
    )
    if not recognized:
        title = chat_string(lang, "title_unknown") or "Tell me more"
        summary = chat_string(lang, "no_predictions") or "I couldn't identify a symptom you are currently experiencing. Tell me what you are feeling in your own words."
        return _structured("symptom_check", lang, title, summary)

    items = [label(item, lang) for item in recognized]
    title = chat_string(lang, "title_assessment") or "Symptom Assessment"
    summary = chat_string(lang, "symptom_summary", symptoms=", ".join(items)) or (
        f"Based only on the symptoms you reported ({', '.join(items)}), here is general health information and safe next steps. This is not a medical diagnosis."
    )

    self_care_tips = _symptom_self_care(recognized, lang)
    red_flags = _symptom_red_flags(recognized, lang)
    follow_up = _symptom_follow_ups(recognized, lang)

    sections = [
        _section(chat_string(lang, "mentioned") or "Symptoms you mentioned", "bullets", items),
        *([_section(chat_string(lang, "safe_self_care_title") or "Self-care", "bullets", self_care_tips)] if self_care_tips else []),
        _section(chat_string(lang, "when_doctor_title") or "Get medical help if", "bullets", red_flags),
    ]

    return _structured("symptom_check", lang, title, summary, sections, follow_up=follow_up)


@chat_bp.post("/message")
def chat_message():
    """Unified offline-first chat route used by the main chat page."""
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Please send a JSON object with a non-empty message."}), 400

    message = str(body.get("message") or "").strip()
    if not message:
        return jsonify({"error": "Please enter a message so I can help."}), 400
    selected_lang = body.get("lang", "en")
    if selected_lang not in {"auto", "en", "hi", "gu"}:
        return jsonify({"error": "'lang' must be one of: auto, en, hi, gu."}), 400
    lang = detect_language(message, selected_lang)

    english_translation = None
    translation_status = None
    if body.get("translate_to_english") is True and lang in {"hi", "gu"}:
        try:
            english_translation = translate_to_english(message)
            translation_status = "translated"
        except TranslationNotConfiguredError:
            current_app.logger.warning(
                "Voice translation is not configured; missing variable: GOOGLE_TRANSLATE_API_KEY"
            )
            translation_status = "not_configured"
        except TranslationProviderError as error:
            current_app.logger.warning(
                "Google Cloud Translation request failed: %s",
                error,
            )
            translation_status = "failed"

    query_for_routing = english_translation or message

    def include_translation(response):
        if translation_status is not None:
            response["translation_status"] = translation_status
            if english_translation:
                response["english_translation"] = english_translation
        return response

    intent = classify_intent(query_for_routing)
    if intent == "emergency":
        response = _structured(intent, lang, chat_string(lang, "title_emergency"), _chat_emergency(lang), [_section(chat_string(lang, "what_to_do"), "bullets", chat_string(lang, "emergency_actions"))], "emergency")
        try:
            verify_jwt_in_request(optional=True)
            response["can_alert"] = bool(get_jwt_identity())
        except Exception:
            response["can_alert"] = False
        return jsonify(include_translation(response))
    if intent == "greeting":
        response = _structured(intent, lang, chat_string(lang, "title_greeting"), chat_string(lang, "chat_greeting"), [_section(chat_string(lang, "what_to_do"), "bullets", chat_string(lang, "examples"))])
        return jsonify(include_translation(response))
    if intent == "disease_info":
        disease = match_disease(query_for_routing)
        if disease:
            info = disease_info(disease, lang)
            sections = [_section(chat_string(lang, "common_symptoms"), "bullets", [label(item, lang) for item in info["symptoms"]]), _section(chat_string(lang, "what_to_do"), "bullets", info["precautions"][:4]), _section(chat_string(lang, "when_doctor"), "bullets", [chat_string(lang, "advice_note")])]
            return jsonify(include_translation(_structured(intent, lang, info["name"], info["description"], sections)))
    if intent == "medicine_info":
        medicine = match_medicine(query_for_routing)
        summary = _chat_medicine_response(query_for_routing, lang)
        return jsonify(include_translation(_structured(intent, lang, medicine["name"] if medicine else chat_string(lang, "title_unknown"), summary)))
    if intent == "symptom_check":
        predictor = get_symptom_predictor(current_app)
        if predictor is not None:
            return jsonify(include_translation(_structured_symptoms(query_for_routing, lang, predictor)))

    response = _structured("unknown", lang, chat_string(lang, "title_unknown"), chat_string(lang, "chat_followup"), [_section(chat_string(lang, "what_to_do"), "bullets", chat_string(lang, "examples"))])
    return jsonify(include_translation(response))
