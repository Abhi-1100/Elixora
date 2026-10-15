import unittest
import os
import json
from unittest.mock import MagicMock
from unittest.mock import patch

from flask import Flask

from app.routes.chat_routes import (
    _llm_recognize_symptoms,
    _remove_negated_symptoms,
    chat_bp,
)
from app.services.chat_router import classify_intent, detect_language, extract_symptoms
from app.services.translation_service import TranslationProviderError


class ChatLanguageTests(unittest.TestCase):
    known_symptoms = (
        "high_fever", "mild_fever", "headache", "cough", "vomiting",
        "dizziness", "itching", "skin_rash", "stomach_pain", "abdominal_pain",
    )

    def make_chat_client(self):
        app = Flask(__name__)
        app.register_blueprint(chat_bp, url_prefix="/api/chat")
        app.extensions["symptom_predictor"] = type(
            "TestPredictor", (), {"known_symptoms": self.known_symptoms}
        )()
        return app.test_client()

    def test_detects_hindi_and_gujarati_scripts_in_auto_mode(self):
        self.assertEqual(detect_language("मुझे बुखार है", "auto"), "hi")
        self.assertEqual(detect_language("મને તાવ છે", "auto"), "gu")

    def test_detects_supported_romanized_hindi_in_auto_mode(self):
        self.assertEqual(detect_language("mujhe bukhar hai", "auto"), "hi")

    def test_auto_mode_defaults_to_english_when_language_is_unknown(self):
        self.assertEqual(detect_language("I need some health advice", "auto"), "en")

    def test_message_endpoint_accepts_auto_and_responds_in_detected_language(self):
        app = Flask(__name__)
        app.register_blueprint(chat_bp, url_prefix="/api/chat")
        response = app.test_client().post(
            "/api/chat/message",
            json={"message": "नमस्ते", "lang": "auto"},
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["lang"], "hi")

    @patch("app.routes.chat_routes.translate_to_english", return_value="hello")
    def test_voice_message_uses_translation_for_routing_and_returns_english(self, translate):
        app = Flask(__name__)
        app.register_blueprint(chat_bp, url_prefix="/api/chat")
        response = app.test_client().post(
            "/api/chat/message",
            json={
                "message": "नमस्ते",
                "lang": "auto",
                "translate_to_english": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["intent"], "greeting")
        self.assertEqual(response.get_json()["lang"], "hi")
        self.assertEqual(response.get_json()["english_translation"], "hello")
        self.assertEqual(response.get_json()["translation_status"], "translated")
        translate.assert_called_once_with("नमस्ते")

    @patch.dict(os.environ, {"GOOGLE_TRANSLATE_API_KEY": ""})
    def test_voice_message_exposes_missing_translation_configuration(self):
        app = Flask(__name__)
        app.register_blueprint(chat_bp, url_prefix="/api/chat")
        response = app.test_client().post(
            "/api/chat/message",
            json={
                "message": "નમસ્તે",
                "lang": "auto",
                "translate_to_english": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["translation_status"], "not_configured")
        self.assertNotIn("english_translation", response.get_json())

    @patch(
        "app.routes.chat_routes.translate_to_english",
        side_effect=TranslationProviderError("http_403"),
    )
    def test_voice_message_reports_translation_provider_failure(self, translate):
        app = Flask(__name__)
        app.register_blueprint(chat_bp, url_prefix="/api/chat")
        response = app.test_client().post(
            "/api/chat/message",
            json={
                "message": "નમસ્તે",
                "lang": "auto",
                "translate_to_english": True,
            },
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["translation_status"], "failed")
        self.assertNotIn("english_translation", response.get_json())
        translate.assert_called_once_with("નમસ્તે")

    def test_negated_symptoms_are_removed_from_chat_routing(self):
        text = "I have headache and fever, but no cough and no vomiting"
        symptoms = ["fever", "cough", "headache", "vomiting"]
        self.assertEqual(
            _remove_negated_symptoms(text, symptoms),
            ["fever", "headache"],
        )
        self.assertEqual(classify_intent("I do not have chest pain"), "unknown")

    def test_natural_language_and_misspelled_health_concerns_are_routed(self):
        cases = {
            "my feet hurt": "foot_pain",
            "my stomach is paining": "stomach_pain",
            "my stomack is paining": "stomach_pain",
            "my head hurts": "headache",
            "headachee": "headache",
            "I have a feaver": "high_fever",
            "I keep coughing": "cough",
            "I am vomitting": "vomiting",
            "I feel dizzy": "dizziness",
            "my skin is itchy": "itching",
            "I twisted my ankle": "injury",
            "I sprained my wrist": "injury",
        }
        for message, expected in cases.items():
            with self.subTest(message=message):
                self.assertEqual(classify_intent(message), "symptom_check")
                self.assertIn(
                    expected,
                    extract_symptoms(message, self.known_symptoms),
                )

    def test_all_supported_concerns_get_causes_care_warnings_and_follow_up(self):
        client = self.make_chat_client()
        cases = (
            ("my feet hurt", "Foot pain"),
            ("my stomach is paining", "indigestion"),
            ("my head hurts", "tension"),
            ("I have a feaver", "infections"),
            ("I keep coughing", "respiratory infection"),
            ("I am vomitting", "stomach infection"),
            ("I feel dizzy", "dehydration"),
            ("my skin is itchy", "irritation"),
            ("I twisted my ankle", "sprain"),
        )
        for message, expected_cause in cases:
            with self.subTest(message=message):
                response = client.post(
                    "/api/chat/message",
                    json={"message": message, "lang": "en"},
                )
                self.assertEqual(response.status_code, 200)
                payload = response.get_json()
                self.assertEqual(payload["intent"], "symptom_check")
                self.assertNotIn("couldn't recognize a symptom", payload["text"].lower())
                sections = {section["heading"]: section["items"] for section in payload["sections"]}
                self.assertTrue(any("Possible causes" in heading for heading in sections))
                self.assertTrue(any("self-care" in heading.lower() for heading in sections))
                self.assertTrue(any("doctor" in heading.lower() or "warning" in heading.lower() for heading in sections))
                all_guidance = " ".join(str(item) for values in sections.values() for item in values).lower()
                self.assertIn(expected_cause.lower(), all_guidance)
                self.assertTrue(payload.get("follow_up"))
                self.assertIn("not a medical diagnosis", payload["disclaimer"].lower())

    def test_unclear_concern_uses_constrained_llm_recognition(self):
        fake_response = MagicMock()
        fake_response.__enter__.return_value.read.return_value = json.dumps({
            "choices": [{
                "message": {
                    "content": json.dumps({
                        "symptoms": ["dizziness", "invented diagnosis"],
                    })
                }
            }]
        }).encode()
        client = self.make_chat_client()
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}), patch(
            "app.routes.chat_routes.urlopen", return_value=fake_response
        ) as llm_request:
            response = client.post(
                "/api/chat/message",
                json={"message": "I feel unsteady and strange", "lang": "en"},
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertIn("dehydration", payload["text"].lower())
        self.assertNotIn("invented diagnosis", payload["text"].lower())
        llm_request.assert_called_once()

    def test_dangerous_symptoms_still_trigger_emergency_guidance(self):
        client = self.make_chat_client()
        for message in ("I am vomiting blood", "I have severe stomach pain"):
            with self.subTest(message=message):
                response = client.post(
                    "/api/chat/message",
                    json={"message": message, "lang": "en"},
                )
                self.assertEqual(response.status_code, 200)
                payload = response.get_json()
                self.assertEqual(payload["intent"], "emergency")
                self.assertEqual(payload["urgency"], "emergency")

    def test_new_guidance_remains_localized_for_hindi_and_gujarati(self):
        client = self.make_chat_client()
        cases = (
            ("मेरे पेट में दर्द है", "hi", "दर्द"),
            ("મને ચક્કર આવે છે", "gu", "ચક્કર"),
        )
        for message, language, expected_text in cases:
            with self.subTest(language=language):
                response = client.post(
                    "/api/chat/message",
                    json={"message": message, "lang": "auto"},
                )
                self.assertEqual(response.status_code, 200)
                payload = response.get_json()
                self.assertEqual(payload["lang"], language)
                self.assertIn(expected_text, payload["text"])
                self.assertTrue(payload.get("follow_up"))

    def test_medicine_questions_do_not_invent_a_dose(self):
        client = self.make_chat_client()
        response = client.post(
            "/api/chat/message",
            json={"message": "What medicine should I take for a headache?", "lang": "en"},
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["intent"], "medicine_info")
        self.assertIn("exact medicine name", payload["text"])
        self.assertIn("dose cannot be safely suggested", payload["text"])


if __name__ == "__main__":
    unittest.main()
