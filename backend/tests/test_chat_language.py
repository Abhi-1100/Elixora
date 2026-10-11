import unittest
import os
from unittest.mock import patch

from flask import Flask

from app.routes.chat_routes import chat_bp
from app.services.chat_router import detect_language
from app.services.translation_service import TranslationProviderError


class ChatLanguageTests(unittest.TestCase):
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


if __name__ == "__main__":
    unittest.main()
