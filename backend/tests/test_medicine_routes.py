import io
import unittest
from unittest.mock import patch

from flask import Flask
from flask_jwt_extended import create_access_token, JWTManager
from PIL import Image
from pillow_heif import from_pillow

from app.routes.medicine_routes import medicine_bp


class MedicineRouteTests(unittest.TestCase):
    def setUp(self):
        self.app = Flask(__name__)
        self.app.config.update(
            TESTING=True,
            JWT_SECRET_KEY="test-jwt-secret-at-least-32-characters",
        )
        JWTManager(self.app)
        self.app.register_blueprint(medicine_bp, url_prefix="/api/medicine")
        self.client = self.app.test_client()
        with self.app.app_context():
            self.token = create_access_token(identity="test-user")

    def _headers(self):
        return {"Authorization": f"Bearer {self.token}"}

    @staticmethod
    def _legacy_response():
        class Response:
            ok = True
            status_code = 200

            @staticmethod
            def json():
                return {
                    "status": "identified",
                    "medicine": "Test medicine",
                    "medicine_info": {"medicineName": "Test medicine"},
                }

        return Response()

    @staticmethod
    def _heif_bytes():
        stream = io.BytesIO()
        from_pillow(Image.new("RGB", (16, 16), "white")).save(stream, format="HEIF")
        return stream.getvalue()

    def test_heic_photo_is_normalized_before_analyzers_are_called(self):
        with (
            patch(
                "app.routes.medicine_routes.requests.post",
                return_value=self._legacy_response(),
            ) as legacy_request,
            patch(
                "app.routes.medicine_routes.analyze_medicine_image",
                return_value={
                    "status": "unavailable",
                    "extraction": None,
                    "verified_record": None,
                },
            ) as gemini_request,
        ):
            response = self.client.post(
                "/api/medicine/analyze",
                headers=self._headers(),
                data={"file": (io.BytesIO(self._heif_bytes()), "medicine.HEIC", "image/heic")},
                content_type="multipart/form-data",
            )

        self.assertEqual(response.status_code, 200)
        uploaded_file = legacy_request.call_args.kwargs["files"]["file"]
        self.assertEqual(uploaded_file[0], "medicine.jpg")
        self.assertEqual(uploaded_file[2], "image/jpeg")
        with Image.open(io.BytesIO(uploaded_file[1])) as normalized:
            self.assertEqual(normalized.format, "JPEG")
        gemini_request.assert_called_once_with(uploaded_file[1], "image/jpeg")

    def test_unreadable_image_returns_a_supported_formats_error(self):
        response = self.client.post(
            "/api/medicine/analyze",
            headers=self._headers(),
            data={"file": (io.BytesIO(b"not an image"), "medicine.heic", "image/heic")},
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("HEIC", response.get_json()["error"])

    def test_unrecognized_extensions_remain_rejected(self):
        response = self.client.post(
            "/api/medicine/analyze",
            headers=self._headers(),
            data={"file": (io.BytesIO(b"image"), "medicine.pdf", "application/pdf")},
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("Unsupported or unreadable image", response.get_json()["error"])


if __name__ == "__main__":
    unittest.main()
