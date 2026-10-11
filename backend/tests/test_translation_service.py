import os
import unittest
from unittest.mock import Mock, patch

import requests

from app.services.translation_service import (
    API_URL,
    TranslationNotConfiguredError,
    TranslationProviderError,
    translate_to_english,
)


class TranslationServiceTests(unittest.TestCase):
    @patch.dict(os.environ, {"GOOGLE_TRANSLATE_API_KEY": "test-key"})
    @patch("app.services.translation_service.requests.post")
    def test_translates_text_using_server_side_api_key(self, post):
        response = Mock()
        response.status_code = 200
        response.json.return_value = {
            "data": {"translations": [{"translatedText": "I have a fever"}]}
        }
        post.return_value = response

        translated = translate_to_english("મને તાવ છે")

        self.assertEqual(translated, "I have a fever")
        post.assert_called_once_with(
            API_URL,
            headers={"X-goog-api-key": "test-key"},
            json={"q": "મને તાવ છે", "target": "en", "format": "text"},
            timeout=10,
        )

    @patch.dict(os.environ, {"GOOGLE_TRANSLATE_API_KEY": ""})
    def test_missing_key_is_reported_without_making_a_request(self):
        with patch("app.services.translation_service.requests.post") as post:
            with self.assertRaises(TranslationNotConfiguredError):
                translate_to_english("મને તાવ છે")
        post.assert_not_called()

    @patch.dict(os.environ, {"GOOGLE_TRANSLATE_API_KEY": "test-key"})
    @patch("app.services.translation_service.requests.post")
    def test_provider_timeout_is_reported_safely(self, post):
        post.side_effect = requests.Timeout("sensitive request details")

        with self.assertRaisesRegex(TranslationProviderError, "timeout"):
            translate_to_english("મને તાવ છે")

    @patch.dict(os.environ, {"GOOGLE_TRANSLATE_API_KEY": "test-key"})
    @patch("app.services.translation_service.requests.post")
    def test_provider_rejection_does_not_return_success_shaped_translation(self, post):
        response = Mock()
        response.status_code = 403
        post.return_value = response

        with self.assertRaisesRegex(TranslationProviderError, "http_403"):
            translate_to_english("મને તાવ છે")


if __name__ == "__main__":
    unittest.main()
