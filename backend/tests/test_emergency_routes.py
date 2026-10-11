import unittest
from datetime import timedelta
from unittest.mock import patch

from flask import Flask
from flask_jwt_extended import create_access_token

from app import db, jwt
from app.models.models import EmergencyContact, User
from app.routes.emergency_routes import emergency_bp
from app.services.notifier import DeliveryResult


class EmergencyRouteTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            TESTING=True,
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            JWT_SECRET_KEY="test-jwt-secret-at-least-32-characters",
            JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),
        )
        db.init_app(self.app)
        jwt.init_app(self.app)
        self.app.register_blueprint(emergency_bp, url_prefix="/api")
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        self.user = User(name="Test User", email="test@example.com")
        self.other_user = User(name="Other User", email="other@example.com")
        db.session.add_all([self.user, self.other_user])
        db.session.commit()
        self.contact = EmergencyContact(
            user_id=self.user.id,
            name="Family Contact",
            relation="Family",
            phone="+14155550123",
            email="relative@example.com",
            notify_sms=True,
            notify_email=True,
        )
        db.session.add(self.contact)
        db.session.commit()
        self.client = self.app.test_client()
        self.token = create_access_token(identity=self.user.id)
        self.other_token = create_access_token(identity=self.other_user.id)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _headers(self, token=None):
        return {"Authorization": f"Bearer {token or self.token}"}

    def test_emergency_alert_requires_authentication(self):
        response = self.client.post(
            "/api/emergency/alert",
            json={"trigger": "sos_button"},
        )
        self.assertEqual(response.status_code, 401)

    def test_users_cannot_edit_another_users_contact(self):
        response = self.client.put(
            f"/api/contacts/{self.contact.id}",
            headers=self._headers(self.other_token),
            json={"notify_sms": False},
        )
        self.assertEqual(response.status_code, 404)
        self.assertTrue(self.contact.notify_sms)

    def test_contact_preferences_require_boolean_values(self):
        response = self.client.put(
            f"/api/contacts/{self.contact.id}",
            headers=self._headers(),
            json={"notify_sms": "false"},
        )
        self.assertEqual(response.status_code, 400)

    def test_contact_rejects_invalid_phone_numbers(self):
        response = self.client.put(
            f"/api/contacts/{self.contact.id}",
            headers=self._headers(),
            json={"phone": "not-a-phone"},
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("valid phone number", response.get_json()["error"])

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_sms_preference_sends_only_sms_to_that_contact(
        self, configured_channels, send_email, send_sms
    ):
        self.contact.notify_email = False
        db.session.commit()
        configured_channels.return_value = {"email": True, "sms": True}
        send_sms.return_value = DeliveryResult(True, "queued", "sms-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        self.assertEqual(response.get_json()["channels"], ["sms"])
        send_email.assert_not_called()
        send_sms.assert_called_once_with("+14155550123", unittest.mock.ANY)

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_email_preference_sends_only_email_to_that_contact(
        self, configured_channels, send_email, send_sms
    ):
        self.contact.notify_sms = False
        db.session.commit()
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        self.assertEqual(response.get_json()["channels"], ["email"])
        send_email.assert_called_once_with("relative@example.com", unittest.mock.ANY, unittest.mock.ANY)
        send_sms.assert_not_called()

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_multiple_contacts_receive_all_enabled_channels(
        self, configured_channels, send_email, send_sms
    ):
        db.session.add(EmergencyContact(
            user_id=self.user.id,
            name="Second Contact",
            relation="Sibling",
            phone="+14155550124",
            email="second@example.com",
            notify_sms=True,
            notify_email=True,
        ))
        db.session.commit()
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")
        send_sms.return_value = DeliveryResult(True, "queued", "sms-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["messages_attempted"], 4)
        self.assertEqual(payload["messages_accepted"], 4)
        self.assertEqual(payload["channel_results"]["email"]["accepted"], 2)
        self.assertEqual(payload["channel_results"]["sms"]["accepted"], 2)
        self.assertEqual(send_email.call_count, 2)
        self.assertEqual(send_sms.call_count, 2)

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_sms_failure_does_not_prevent_email_attempt(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_sms.return_value = DeliveryResult(False, "provider_error", error_code="twilio_error")
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        payload = response.get_json()
        self.assertEqual(payload["status"], "partial")
        self.assertEqual(payload["channel_results"]["sms"]["status"], "failed")
        self.assertEqual(payload["channel_results"]["email"]["status"], "provider_accepted")
        self.assertIn(
            "provider_error:twilio_error",
            payload["channel_results"]["sms"]["errors"],
        )
        send_sms.assert_called_once()
        send_email.assert_called_once()

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_email_failure_does_not_prevent_sms_attempt(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(
            False,
            "provider_error",
            error_code="sendgrid_error",
        )
        send_sms.return_value = DeliveryResult(True, "queued", "sms-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        payload = response.get_json()
        self.assertEqual(payload["status"], "partial")
        self.assertEqual(
            payload["channel_results"]["email"]["status"],
            "failed",
        )
        self.assertEqual(
            payload["channel_results"]["sms"]["status"],
            "provider_accepted",
        )
        send_email.assert_called_once()
        send_sms.assert_called_once()

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_enabled_channel_without_address_is_reported_as_partial(
        self, configured_channels, send_email, send_sms
    ):
        self.contact.phone = None
        db.session.commit()
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        payload = response.get_json()
        self.assertEqual(payload["status"], "partial")
        self.assertIn("sms", payload["invalid_channels"])
        self.assertEqual(payload["channel_results"]["sms"]["status"], "failed")
        send_sms.assert_not_called()
        send_email.assert_called_once()

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_no_eligible_contact_details_returns_error_without_sending(
        self, configured_channels, send_email, send_sms
    ):
        self.contact.phone = None
        self.contact.email = None
        db.session.commit()
        configured_channels.return_value = {"email": True, "sms": True}

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        self.assertEqual(response.status_code, 400)
        send_email.assert_not_called()
        send_sms.assert_not_called()

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_test_alert_uses_only_opted_in_saved_contacts(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")
        send_sms.return_value = DeliveryResult(True, "queued", "sms-id")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={"note": "sensitive medical note must not be sent"},
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(payload["status"], "queued")
        self.assertEqual(payload["messages_accepted"], 2)
        self.assertEqual(payload["channels"], ["email", "sms"])
        self.assertIn("Delivery is not confirmed", payload["message"])
        send_email.assert_called_once()
        self.assertEqual(send_email.call_args.args[0], "relative@example.com")
        self.assertNotIn(
            "sensitive medical note",
            send_email.call_args.args[2],
        )
        send_sms.assert_called_once()
        self.assertEqual(send_sms.call_args.args[0], "+14155550123")
        self.assertNotIn(
            "sensitive medical note",
            send_sms.call_args.args[1],
        )

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_accepted_alert_is_rate_limited_to_prevent_duplicates(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")
        send_sms.return_value = DeliveryResult(True, "queued", "sms-id")

        first = self.client.post(
            "/api/emergency/alert",
            headers=self._headers(),
            json={"trigger": "sos_button"},
        )
        second = self.client.post(
            "/api/emergency/alert",
            headers=self._headers(),
            json={"trigger": "sos_button"},
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 429)
        self.assertEqual(send_email.call_count, 1)
        self.assertEqual(send_sms.call_count, 1)

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_idempotency_key_prevents_duplicate_provider_requests(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(True, "accepted", "email-id")
        send_sms.return_value = DeliveryResult(True, "queued", "sms-id")
        headers = {**self._headers(), "Idempotency-Key": "f2eb0fc9-e8be-4c75-88f2-7074c846e531"}

        first = self.client.post(
            "/api/emergency/alert",
            headers=headers,
            json={"trigger": "sos_button"},
        )
        repeated = self.client.post(
            "/api/emergency/alert",
            headers=headers,
            json={"trigger": "sos_button"},
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(repeated.status_code, 409)
        self.assertEqual(send_email.call_count, 1)
        self.assertEqual(send_sms.call_count, 1)

    def test_no_enabled_notification_channels_returns_separate_statuses(self):
        self.contact.notify_email = False
        self.contact.notify_sms = False
        db.session.commit()

        response = self.client.post(
            "/api/emergency/alert",
            headers=self._headers(),
            json={"trigger": "sos_button"},
        )

        payload = response.get_json()
        self.assertEqual(response.status_code, 400)
        self.assertEqual(payload["channel_results"]["email"]["status"], "not_requested")
        self.assertEqual(payload["channel_results"]["sms"]["status"], "not_requested")

    def test_invalid_location_is_rejected_before_any_notification(self):
        response = self.client.post(
            "/api/emergency/alert",
            headers=self._headers(),
            json={"trigger": "sos_button", "latitude": True, "longitude": 181},
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()["error"], "Location coordinates are invalid")

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    @patch("app.routes.emergency_routes.provider_configuration_issues")
    def test_missing_provider_configuration_is_explicit(
        self, provider_configuration_issues, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": False, "sms": False}
        provider_configuration_issues.side_effect = lambda channel: {
            "missing": (
                ["SENDGRID_API_KEY", "SENDGRID_FROM_EMAIL"]
                if channel == "email"
                else ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"]
            ),
            "invalid": [],
        }
        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )
        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["status"], "failed")
        self.assertEqual(payload["unavailable_channels"], ["email", "sms"])
        self.assertIn("SENDGRID_API_KEY", payload["message"])
        self.assertIn("TWILIO_PHONE_NUMBER", payload["message"])
        self.assertIn(
            "missing_configuration:SENDGRID_API_KEY",
            payload["channel_results"]["email"]["errors"],
        )
        self.assertIn(
            "missing_configuration:TWILIO_PHONE_NUMBER",
            payload["channel_results"]["sms"]["errors"],
        )
        send_email.assert_not_called()
        send_sms.assert_not_called()

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_provider_failure_is_not_reported_as_delivery(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(False, "provider_error", error_code="sendgrid_error")
        send_sms.return_value = DeliveryResult(False, "provider_error", error_code="twilio_error")

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )
        payload = response.get_json()
        self.assertEqual(payload["status"], "failed")
        self.assertEqual(payload["messages_accepted"], 0)
        self.assertEqual(payload["failed_channels"], ["email", "sms"])
        self.assertNotIn("delivered", payload["message"].lower())
        self.assertIn(
            "provider_error:sendgrid_error",
            payload["channel_results"]["email"]["errors"],
        )
        self.assertIn(
            "provider_error:twilio_error",
            payload["channel_results"]["sms"]["errors"],
        )

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_failed_alert_is_rate_limited_to_prevent_duplicate_sends(
        self, configured_channels, send_email, send_sms
    ):
        configured_channels.return_value = {"email": True, "sms": True}
        send_email.return_value = DeliveryResult(
            False,
            "provider_error",
            error_code="sendgrid_timeout",
        )
        send_sms.return_value = DeliveryResult(
            False,
            "provider_error",
            error_code="twilio_timeout",
        )

        first = self.client.post(
            "/api/emergency/alert",
            headers=self._headers(),
            json={"trigger": "sos_button"},
        )
        second = self.client.post(
            "/api/emergency/alert",
            headers=self._headers(),
            json={"trigger": "sos_button"},
        )

        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.get_json()["status"], "failed")
        self.assertEqual(second.status_code, 429)
        self.assertEqual(send_email.call_count, 1)
        self.assertEqual(send_sms.call_count, 1)

    @patch("app.routes.emergency_routes.send_sms")
    @patch("app.routes.emergency_routes.send_email")
    @patch("app.routes.emergency_routes.configured_channels")
    def test_invalid_saved_recipient_is_reported_separately(
        self, configured_channels, send_email, send_sms
    ):
        self.contact.email = "invalid-email"
        db.session.commit()
        configured_channels.return_value = {"email": True, "sms": False}

        response = self.client.post(
            "/api/emergency/test",
            headers=self._headers(),
            json={},
        )

        payload = response.get_json()
        self.assertEqual(payload["channel_results"]["email"]["status"], "failed")
        self.assertIn(
            "invalid_recipient:email",
            payload["channel_results"]["email"]["errors"],
        )
        send_email.assert_not_called()
        send_sms.assert_not_called()


if __name__ == "__main__":
    unittest.main()
