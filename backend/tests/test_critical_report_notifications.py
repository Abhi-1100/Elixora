import io
import shutil
import tempfile
import unittest
from datetime import timedelta
from unittest.mock import patch

from flask import Flask
from flask_jwt_extended import create_access_token

from app import db, jwt
from app.models.models import AlertLog, EmergencyContact, User
from app.routes import report_routes
from app.routes.report_routes import report_bp
from app.services.notifier import DeliveryResult


class CriticalReportNotificationFlowTests(unittest.TestCase):
    def setUp(self):
        self.upload_dir = tempfile.mkdtemp(prefix="elixora-critical-report-")
        self.app = Flask(__name__)
        self.app.config.update(
            TESTING=True,
            SQLALCHEMY_DATABASE_URI="sqlite://",
            SQLALCHEMY_TRACK_MODIFICATIONS=False,
            JWT_SECRET_KEY="test-jwt-secret-at-least-32-characters",
            JWT_ACCESS_TOKEN_EXPIRES=timedelta(hours=1),
            UPLOAD_FOLDER=self.upload_dir,
        )
        db.init_app(self.app)
        jwt.init_app(self.app)
        self.app.register_blueprint(report_bp, url_prefix="/api/reports")
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        self.user = User(name="Sample Patient", email="sample.patient@example.com", gender="Male")
        db.session.add(self.user)
        db.session.flush()
        self.contact = EmergencyContact(
            user_id=self.user.id,
            name="Sample Contact",
            relation="Family",
            email="contact@example.com",
            phone="+14155550123",
            notify_email=True,
            notify_sms=True,
        )
        db.session.add(self.contact)
        db.session.commit()
        self.client = self.app.test_client()
        self.headers = {
            "Authorization": f"Bearer {create_access_token(identity=self.user.id)}"
        }

    def _sample_critical_pdf(self):
        document = report_routes.fitz.open()
        page = document.new_page()
        page.insert_text(
            (72, 72),
            "Patient: Synthetic Test\nHemoglobin (Hb) 5.0 g/dL\n"
            "This generated document is a synthetic integration test sample.",
        )
        contents = document.tobytes()
        document.close()
        return contents

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
        shutil.rmtree(self.upload_dir, ignore_errors=True)

    @patch("app.services.notifier.send_sms")
    @patch("app.routes.report_routes.send_email")
    def test_critical_sample_upload_emails_summary_without_using_sms(
        self, send_email, send_sms
    ):
        # A generated PDF exercises real text extraction and reference-range
        # classification; the mocked mail provider prevents sending to a contact.
        send_email.return_value = DeliveryResult(True, "accepted", "test-message-id")

        response = self.client.post(
            "/api/reports/upload",
            headers=self.headers,
            data={"file": (io.BytesIO(self._sample_critical_pdf()), "sample.pdf")},
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 201)
        payload = response.get_json()
        self.assertEqual(payload["overall_status"], "Critical")
        self.assertEqual(payload["results"][0]["status"], "Critical")
        self.assertEqual(payload["emergency_notification"]["email_status"], "accepted")
        self.assertEqual(payload["emergency_notification"]["whatsapp_status"], "awaiting_manual_send")
        self.assertEqual(payload["emergency_notification"]["contacts_notified"], 1)
        send_email.assert_called_once()
        email_summary = send_email.call_args.args[2]
        self.assertIn("Hemoglobin (Hb): 5.0 g/dL", email_summary)
        self.assertIn("Critical (below reference range)", email_summary)
        self.assertIn("Contact a qualified clinician urgently", email_summary)
        send_sms.assert_not_called()

        alert = AlertLog.query.filter_by(id=payload["report_id"]).one()
        self.assertEqual(alert.trigger, "critical_lab_report")
        self.assertEqual(alert.status, "accepted")
        self.assertEqual(alert.channels, "email")
        detail = self.client.get(f"/api/reports/{payload['report_id']}", headers=self.headers)
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(detail.get_json()["emergency_notification"]["email_status"], "accepted")

    @patch("app.routes.report_routes.send_email")
    def test_disabled_email_preference_does_not_send_report(self, send_email):
        self.contact.notify_email = False
        db.session.commit()

        response = self.client.post(
            "/api/reports/upload",
            headers=self.headers,
            data={"file": (io.BytesIO(self._sample_critical_pdf()), "sample.pdf")},
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["emergency_notification"]["email_status"], "not_enabled")
        send_email.assert_not_called()


if __name__ == "__main__":
    unittest.main()
