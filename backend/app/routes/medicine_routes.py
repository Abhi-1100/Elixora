import os

import requests
from flask import Blueprint, current_app, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

medicine_bp = Blueprint("medicine_bp", __name__)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@medicine_bp.route("/analyze", methods=["POST"])
@jwt_required()
def analyze_medicine():
    if not get_jwt_identity():
        return jsonify({"error": "Authentication required."}), 401

    image = request.files.get("file")
    if image is None or not image.filename:
        return jsonify({"error": "Choose a medicine image to analyze."}), 400

    extension = os.path.splitext(image.filename)[1].lower()
    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({"error": "Unsupported image type. Use JPG, PNG, WEBP, BMP, or TIFF."}), 400

    contents = image.read(MAX_FILE_SIZE + 1)
    if not contents:
        return jsonify({"error": "The selected image is empty."}), 400
    if len(contents) > MAX_FILE_SIZE:
        return jsonify({"error": "Image size must be under 10 MB."}), 400

    api_url = os.getenv("MEDICINE_AI_API_URL", "http://127.0.0.1:8000").rstrip("/")
    timeout = float(os.getenv("MEDICINE_AI_TIMEOUT_SECONDS", "120"))
    try:
        response = requests.post(
            f"{api_url}/predict",
            files={"file": (image.filename, contents, image.mimetype or "application/octet-stream")},
            timeout=(5, timeout),
        )
    except requests.Timeout:
        current_app.logger.warning("Medicine AI request timed out")
        return jsonify({"error": "Medicine analysis timed out. Please try again."}), 504
    except requests.RequestException:
        current_app.logger.warning("Medicine AI service is unavailable", exc_info=True)
        return jsonify({"error": "Medicine Analyzer is temporarily unavailable. Please try again later."}), 503

    try:
        result = response.json()
    except ValueError:
        current_app.logger.error("Medicine AI returned a non-JSON response (%s)", response.status_code)
        return jsonify({"error": "Medicine analysis returned an invalid response. Please try again."}), 502

    if not response.ok:
        detail = result.get("detail") if isinstance(result, dict) else None
        return jsonify({"error": detail or "Medicine analysis failed. Please try a valid, clear image."}), response.status_code

    if not isinstance(result, dict) or result.get("status") not in {"identified", "uncertain"}:
        current_app.logger.error("Medicine AI returned an unexpected response shape")
        return jsonify({"error": "Medicine analysis returned an unexpected response. Please try again."}), 502

    return jsonify(result), 200