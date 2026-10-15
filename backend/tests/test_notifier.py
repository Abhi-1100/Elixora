import os
import unittest
from pathlib import Path
from unittest.mock import MagicMock, patch

from python_http_client.exceptions import HTTPError
from requests.exceptions import Timeout as RequestTimeout
from twilio.base.exceptions import TwilioRestException

from app import BACKEND_ENV_FILE
from app.services import notifier


class NotifierTests(unittest.TestCase):
    def test_backend_env_path_is_independent_of_the_launch_directory(self):
        self.assertEqual(
            BACKEND_ENV_FILE,
            Path(__file__).resolve().parents[1] / ".env",
        )

    def test_missing_credentials_are_reported(self):
        with patch.dict(os.environ, {}, clear=True):
            self.assertEqual(
                notifier.configured_channels(),
                {"email": False, "sms": False},
            )
            self.assertEqual(
                notifier.send_sms("+14155550123", "test").error_code,
                "sms_not_configured",
            )
            self.assertEqual(
                notifier.send_email("relative@example.com", "test", "test").error_code,
                "email_not_configured",
            )

    def test_environment_status_reports_presence_without_values(self):
        secrets = {
            "TWILIO_ACCOUNT_SID": "account-secret",
            "TWILIO_AUTH_TOKEN": "token-secret",
            "TWILIO_PHONE_NUMBER": "",
            "SENDGRID_API_KEY": "sendgrid-secret",
            "SENDGRID_FROM_EMAIL": "supportproject1100@gmail.com",
        }
        with patch.dict(os.environ, secrets, clear=True):
            status = notifier.environment_variable_status()

        self.assertEqual(
            status,
            {
                "TWILIO_ACCOUNT_SID": True,
                "TWILIO_AUTH_TOKEN": True,
                "TWILIO_PHONE_NUMBER": False,
                "SMTP_HOST": False,
                "SMTP_PORT": False,
                "SMTP_USER": False,
                "SMTP_PASSWORD": False,
                "SMTP_FROM": False,
                "SENDGRID_API_KEY": True,
                "SENDGRID_FROM_EMAIL": True,
            },
        )
        self.assertNotIn("account-secret", repr(status))
        self.assertNotIn("token-secret", repr(status))
        self.assertNotIn("sendgrid-secret", repr(status))

    def test_sender_configuration_requires_valid_addresses(self):
        with patch.dict(
            os.environ,
            {
                "SENDGRID_API_KEY": "test-api-key",
                "SENDGRID_FROM_EMAIL": "not-an-email",
                "TWILIO_ACCOUNT_SID": "test-account",
                "TWILIO_AUTH_TOKEN": "test-token",
                "TWILIO_PHONE_NUMBER": "not-a-number",
            },
            clear=True,
        ):
            self.assertEqual(notifier.configured_channels(), {"email": False, "sms": False})

    def test_example_placeholders_are_not_treated_as_real_credentials(self):
        with patch.dict(
            os.environ,
            {
                "TWILIO_ACCOUNT_SID": "your-twilio-account-sid",
                "TWILIO_AUTH_TOKEN": "your-twilio-auth-token",
                "TWILIO_PHONE_NUMBER": "your-twilio-phone-number",
                "SENDGRID_API_KEY": "your-sendgrid-mail-send-api-key",
                "SENDGRID_FROM_EMAIL": "your-verified-sender@example.com",
            },
            clear=True,
        ):
            self.assertEqual(
                notifier.configured_channels(),
                {"email": False, "sms": False},
            )
            self.assertEqual(
                notifier.provider_configuration_issues("sms")["missing"],
                ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
            )
            self.assertEqual(
                notifier.provider_configuration_issues("email")["missing"],
                ["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"],
            )

    def test_missing_configuration_logs_variable_names_without_secret_values(self):
        secrets = {
            "SENDGRID_API_KEY": "test-sendgrid-secret",
            "TWILIO_AUTH_TOKEN": "test-twilio-secret",
        }
        with patch.dict(
            os.environ,
            {
                **secrets,
                "SENDGRID_FROM_EMAIL": "",
                "TWILIO_ACCOUNT_SID": "",
                "TWILIO_PHONE_NUMBER": "",
            },
            clear=True,
        ):
            with self.assertLogs(notifier.logger, level="WARNING") as captured:
                notifier.configured_channels()

        output = "\n".join(captured.output)
        self.assertIn("SENDGRID_FROM_EMAIL", output)
        self.assertIn("TWILIO_ACCOUNT_SID", output)
        self.assertIn("TWILIO_PHONE_NUMBER", output)
        for secret in secrets.values():
            self.assertNotIn(secret, output)

    def test_phone_numbers_are_normalized_and_validated(self):
        self.assertEqual(notifier.normalize_phone("(415) 555-0123"), "+914155550123")
        self.assertEqual(notifier.normalize_phone("0014155550123"), "+14155550123")
        self.assertIsNone(notifier.normalize_phone("not a number"))
        self.assertIsNone(notifier.normalize_phone("+01234567"))

    def test_twilio_sender_alias_conflict_diagnostic_does_not_return_numbers(self):
        with patch.dict(
            os.environ,
            {
                "TWILIO_PHONE_NUMBER": "+14155550000",
                "TWILIO_FROM": "+14155550001",
            },
            clear=True,
        ):
            conflict = notifier.twilio_sender_alias_conflicts()

        self.assertTrue(conflict)
        self.assertNotIn("+14155550000", repr(conflict))
        self.assertNotIn("+14155550001", repr(conflict))

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_FROM": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_legacy_twilio_from_is_supported_when_canonical_sender_missing(
        self, client_class
    ):
        client_class.return_value.messages.create.return_value = MagicMock(
            sid="SM-test-id",
            status="queued",
        )

        result = notifier.send_sms("+14155550123", "minimal alert")

        self.assertTrue(result.accepted)
        client_class.return_value.messages.create.assert_called_once_with(
            to="+14155550123",
            from_="+14155550000",
            body="minimal alert",
        )

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_FROM": "+14155550001",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_canonical_twilio_sender_takes_precedence_over_legacy_alias(
        self, client_class
    ):
        client_class.return_value.messages.create.return_value = MagicMock(
            sid="SM-test-id",
            status="queued",
        )

        result = notifier.send_sms("+14155550123", "minimal alert")

        self.assertTrue(result.accepted)
        client_class.return_value.messages.create.assert_called_once_with(
            to="+14155550123",
            from_="+14155550000",
            body="minimal alert",
        )

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_twilio_accepted_message_uses_only_requested_contact(self, client_class):
        client_class.return_value.messages.create.return_value = MagicMock(
            sid="SM-test-id",
            status="queued",
        )

        result = notifier.send_sms("(415) 555-0123", "minimal alert")

        self.assertTrue(result.accepted)
        self.assertEqual(result.provider_status, "queued")
        self.assertEqual(result.message_id, "SM-test-id")
        client_class.return_value.messages.create.assert_called_once_with(
            to="+914155550123",
            from_="+14155550000",
            body="minimal alert",
        )

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_invalid_phone_is_not_sent(self, client_class):
        result = notifier.send_sms("invalid", "minimal alert")
        self.assertFalse(result.accepted)
        self.assertEqual(result.error_code, "invalid_phone")
        client_class.assert_not_called()

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_sendgrid_202_is_reported_as_accepted_not_delivered(self, client_class):
        client_class.return_value.send.return_value = MagicMock(
            status_code=202,
            headers={"X-Message-Id": "email-test-id"},
        )

        result = notifier.send_email(
            "relative@example.com",
            "Elixora emergency alert",
            "minimal alert",
        )

        self.assertTrue(result.accepted)
        self.assertEqual(result.provider_status, "accepted")
        self.assertEqual(result.message_id, "email-test-id")

    @patch.dict(
        os.environ,
        {
            "SMTP_HOST": "smtp.example.com",
            "SMTP_PORT": "587",
            "SMTP_USER": "alerts@example.com",
            "SMTP_PASSWORD": "smtp-app-password",
            "SMTP_FROM": "alerts@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.smtplib.SMTP")
    def test_smtp_starttls_acceptance_is_reported_without_delivery_claim(self, smtp_class):
        smtp = MagicMock()
        smtp_class.return_value.__enter__.return_value = smtp

        result = notifier.send_email("relative@example.com", "Elixora alert", "summary")

        self.assertTrue(result.accepted)
        self.assertEqual(result.provider_status, "accepted")
        smtp.starttls.assert_called_once()
        smtp.send_message.assert_called_once()

    @patch.dict(
        os.environ,
        {
            "SMTP_HOST": "smtp.example.com",
            "SMTP_PORT": "587",
            "SMTP_USER": "alerts@example.com",
            "SMTP_PASSWORD": "smtp-app-password",
            "SMTP_FROM": "alerts@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.smtplib.SMTP")
    def test_smtp_failure_is_reported_safely(self, smtp_class):
        smtp_class.return_value.__enter__.side_effect = OSError("private connection details")

        result = notifier.send_email("relative@example.com", "Elixora alert", "summary")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "smtp_request_failed")

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_invalid_email_is_not_sent(self, client_class):
        result = notifier.send_email("not-an-email", "test", "test")
        self.assertFalse(result.accepted)
        self.assertEqual(result.error_code, "invalid_email")
        client_class.assert_not_called()

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "not-an-email",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_invalid_sendgrid_sender_is_reported_as_configuration_error(
        self, client_class
    ):
        result = notifier.send_email("relative@example.com", "test", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "invalid_configuration")
        self.assertEqual(result.error_code, "invalid_email_sender")
        client_class.assert_not_called()

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_sendgrid_provider_error_is_reported_safely(self, client_class):
        error = HTTPError(403, "Forbidden", b"", {})
        client_class.return_value.send.side_effect = error

        result = notifier.send_email("relative@example.com", "test", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "sendgrid_http_403")

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_sendgrid_authentication_rejection_is_not_accepted(self, client_class):
        client_class.return_value.send.side_effect = HTTPError(401, "Unauthorized", b"", {})

        result = notifier.send_email("relative@example.com", "test", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "sendgrid_http_401")

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_sendgrid_timeout_is_reported_safely(self, client_class):
        client_class.return_value.send.side_effect = TimeoutError("timeout")

        result = notifier.send_email("relative@example.com", "test", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "sendgrid_timeout")
        self.assertEqual(
            client_class.return_value.client.timeout,
            notifier.PROVIDER_TIMEOUT_SECONDS,
        )

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_sendgrid_connection_failure_is_reported_safely(self, client_class):
        client_class.return_value.send.side_effect = OSError("connection failed")

        result = notifier.send_email("relative@example.com", "test", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.error_code, "sendgrid_connection_error")

    @patch.dict(
        os.environ,
        {
            "SENDGRID_API_KEY": "test-api-key",
            "SENDGRID_FROM_EMAIL": "verified@example.com",
        },
        clear=True,
    )
    @patch("app.services.notifier.SendGridAPIClient")
    def test_sendgrid_http_timeout_is_reported_safely(self, client_class):
        client_class.return_value.send.side_effect = RequestTimeout("timeout")

        result = notifier.send_email("relative@example.com", "test", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.error_code, "sendgrid_timeout")

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_twilio_provider_error_is_reported_safely(self, client_class):
        client_class.return_value.messages.create.side_effect = TwilioRestException(
            status=400,
            uri="/Messages",
            msg="invalid destination",
            code=21211,
        )

        result = notifier.send_sms("+14155550123", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "twilio_21211")

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_twilio_authentication_rejection_is_not_accepted(self, client_class):
        client_class.return_value.messages.create.side_effect = TwilioRestException(
            status=401,
            uri="/Messages",
            msg="authentication failed",
            code=20003,
        )

        result = notifier.send_sms("+14155550123", "minimal alert")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "twilio_20003")

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_twilio_timeout_is_reported_safely(self, client_class):
        client_class.return_value.messages.create.side_effect = RequestTimeout("timeout")

        result = notifier.send_sms("+14155550123", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "provider_error")
        self.assertEqual(result.error_code, "twilio_request_error")
        http_client = client_class.call_args.kwargs["http_client"]
        self.assertEqual(http_client.timeout, notifier.PROVIDER_TIMEOUT_SECONDS)

    @patch.dict(
        os.environ,
        {
            "TWILIO_ACCOUNT_SID": "test-account",
            "TWILIO_AUTH_TOKEN": "test-token",
            "TWILIO_PHONE_NUMBER": "+14155550000",
        },
        clear=True,
    )
    @patch("app.services.notifier.Client")
    def test_twilio_delivery_failure_is_not_reported_as_accepted(self, client_class):
        client_class.return_value.messages.create.return_value = MagicMock(
            sid="SM-test-id",
            status="undelivered",
        )

        result = notifier.send_sms("+14155550123", "test")

        self.assertFalse(result.accepted)
        self.assertEqual(result.provider_status, "undelivered")
        self.assertEqual(result.error_code, "twilio_delivery_failed")

    def test_alert_message_excludes_user_supplied_medical_note(self):
        message = notifier.build_alert_message("Elixora user")
        self.assertIn("Elixora user triggered an emergency alert", message)
        self.assertNotIn("sensitive medical detail", message)


if __name__ == "__main__":
    unittest.main()
