"""
Multilingual prediction + response formatting.
Load once at app startup (same as your existing model loading).
"""
import json
import re
from pathlib import Path
import joblib
import pandas as pd

# The Flask project root is the parent of the directory containing this
# module (the module lives in <project-root>/ml). Build absolute paths from it
# so imports work independently of the process's current working directory.
APP_ROOT = Path(__file__).resolve().parent.parent
ML_DIR = APP_ROOT / 'ml'

model = joblib.load(ML_DIR / 'disease_prediction_model.pkl')
label_encoder = joblib.load(ML_DIR / 'label_encoder.pkl')
symptom_columns = joblib.load(ML_DIR / 'symptom_columns.pkl')

with open(ML_DIR / 'i18n' / 'disease_info_multilang.json', encoding='utf-8') as f:
    disease_info_multilang = json.load(f)

with open(ML_DIR / 'i18n' / 'ui_strings.json', encoding='utf-8') as f:
    ui_strings = json.load(f)

SUPPORTED_LANGS = {'en', 'hi', 'gu'}
LOW_CONFIDENCE_THRESHOLD = 40.0  # tune this based on testing


def normalize_symptom(text):
    text = text.strip().lower()
    text = re.sub(r'[\s]+', '_', text)
    text = text.replace('-', '_')
    return text


def predict_disease(symptom_text_or_list):
    """Language-agnostic — this part of the pipeline never changes.
    Only the *display* of the result is localized (see format_response)."""
    if isinstance(symptom_text_or_list, str):
        raw_symptoms = [s for s in symptom_text_or_list.split(',') if s.strip()]
    else:
        raw_symptoms = symptom_text_or_list

    normalized = [normalize_symptom(s) for s in raw_symptoms]
    known = [s for s in normalized if s in symptom_columns]
    unknown = [s for s in normalized if s not in symptom_columns]

    if not known:
        return {'disease_key': None, 'confidence': 0.0, 'unrecognized_symptoms': unknown}

    input_vector = pd.DataFrame([[1 if col in known else 0 for col in symptom_columns]], columns=symptom_columns)
    pred_encoded = model.predict(input_vector)[0]
    pred_proba = model.predict_proba(input_vector)[0]
    confidence = round(float(pred_proba[pred_encoded]) * 100, 2)
    disease_key = label_encoder.inverse_transform([pred_encoded])[0]  # English key, used to look up disease_info_multilang

    return {
        'disease_key': disease_key,
        'confidence': confidence,
        'unrecognized_symptoms': unknown,
        'symptoms_used': known,
    }


def format_response(prediction_result, lang='en'):
    """Takes the raw model prediction (language-agnostic) and the user's
    selected language, and returns fully localized chat text + structured data.
    """
    if lang not in SUPPORTED_LANGS:
        lang = 'en'
    strings = ui_strings[lang]

    disease_key = prediction_result['disease_key']

    if disease_key is None:
        return {
            'text': strings['no_match'],
            'disease': None,
            'confidence': 0.0,
        }

    info = disease_info_multilang[disease_key].get(lang, disease_info_multilang[disease_key]['en'])
    confidence = prediction_result['confidence']

    lines = []
    lines.append(strings['symptom_match_intro'].format(disease=info['name']))
    lines.append(strings['advice_note'])
    lines.append('')
    lines.append(strings['ml_prediction_label'].format(disease=info['name'], confidence=confidence))
    lines.append(f"{strings['what_it_is_label']} {info['description']}")
    precaution_text = ', '.join(info['precautions'])
    lines.append(f"{strings['precautions_label']} {precaution_text}")

    if confidence < LOW_CONFIDENCE_THRESHOLD:
        lines.append('')
        lines.append(strings['low_confidence_note'])

    if prediction_result['unrecognized_symptoms']:
        lines.append('')
        lines.append(strings['unrecognized_symptom_note'].format(
            symptoms=', '.join(prediction_result['unrecognized_symptoms'])
        ))

    lines.append('')
    lines.append(strings['disclaimer'])

    return {
        'text': '\n'.join(lines),
        'disease': info['name'],
        'disease_key': disease_key,
        'confidence': confidence,
    }


# ---------------- Example usage in your Flask chat endpoint ----------------
if __name__ == '__main__':
    symptoms = "high fever, headache, skin rash, fatigue, nausea"

    raw = predict_disease(symptoms)

    for lang in ['en', 'hi', 'gu']:
        result = format_response(raw, lang=lang)
        print(f"===== {lang.upper()} =====")
        print(result['text'])
        print()
