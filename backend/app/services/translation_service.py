"""Server-side English translation through Google Cloud Translation - Basic."""

import html
import os

import requests


API_URL = "https://translation.googleapis.com/language/translate/v2"
API_KEY_ENV = "GOOGLE_TRANSLATE_API_KEY"


class TranslationNotConfiguredError(Exception):
    """Raised when the Google Cloud Translation API key is missing."""


class TranslationProviderError(Exception):
    """Raised for safe-to-log provider failures, without request or key values."""


def translate_to_english(text: str) -> str:
    api_key = os.getenv(API_KEY_ENV, "").strip()
    if not api_key or api_key.lower().startswith(("your-", "replace-with-", "changeme")):
        raise TranslationNotConfiguredError

    try:
        response = requests.post(
            API_URL,
            headers={"X-goog-api-key": api_key},
            json={"q": text, "target": "en", "format": "text"},
            timeout=10,
        )
    except requests.Timeout:
        raise TranslationProviderError("timeout") from None
    except requests.RequestException:
        raise TranslationProviderError("request_failed") from None

    if not 200 <= response.status_code < 300:
        raise TranslationProviderError(f"http_{response.status_code}")

    try:
        translated = response.json()["data"]["translations"][0]["translatedText"]
    except (ValueError, KeyError, IndexError, TypeError):
        raise TranslationProviderError("invalid_response") from None

    if not isinstance(translated, str) or not translated.strip():
        raise TranslationProviderError("empty_response")

    return html.unescape(translated).strip()
