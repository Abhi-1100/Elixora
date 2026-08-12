import os
import re
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
try:
    import pymupdf as fitz  # PyMuPDF >= 1.24 — preferred import
except ImportError:
    try:
        import fitz  # older PyMuPDF fallback
    except ImportError:
        fitz = None

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

try:
    import pytesseract
    # Default Windows Tesseract path fallback
    if os.name == "nt" and not pytesseract.pytesseract.tesseract_cmd or pytesseract.pytesseract.tesseract_cmd == "tesseract":
        default_tess = r"C:\Program Files\Tesseract-OCR\tesseract.exe"
        if os.path.exists(default_tess):
            pytesseract.pytesseract.tesseract_cmd = default_tess
except ImportError:
    pytesseract = None

try:
    from pdf2image import convert_from_path
except ImportError:
    convert_from_path = None

try:
    from thefuzz import process
except ImportError:
    process = None

from app import db, REFERENCE_ROWS, REFERENCE_NAMES
from app.models.models import User, Report, ReportTestResult

report_bp = Blueprint("report_bp", __name__)

ALLOWED_EXTENSIONS = {"pdf", "jpg", "jpeg", "png"}


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def extract_text_from_pdf(filepath):
    """Extract text from text-based PDF using PyMuPDF."""
    if not fitz:
        print("[OCR] PyMuPDF (fitz) is not installed")
        return ""
    text = ""
    try:
        doc = fitz.open(filepath)
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
    except Exception as e:
        print(f"[OCR] PyMuPDF extraction error: {e}")
    return text.strip()


def ocr_image(image_input):
    """Run OpenCV preprocessing & pytesseract on image (path or numpy array)."""
    if not pytesseract:
        print("[OCR] pytesseract not installed/available")
        return ""
    try:
        if isinstance(image_input, str):
            if cv2:
                img = cv2.imread(image_input)
            else:
                from PIL import Image
                img = Image.open(image_input)
        else:
            img = image_input

        if cv2 and isinstance(img, np.ndarray):
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            # Thresholding / Denoise
            processed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
            text = pytesseract.image_to_string(processed)
        else:
            text = pytesseract.image_to_string(img)
        return text
    except Exception as e:
        print(f"[OCR] Image OCR error: {e}")
        return ""


def process_report_file(filepath, ext):
    """Pipeline: PyMuPDF -> fallback OCR if needed."""
    raw_text = ""
    if ext == "pdf":
        raw_text = extract_text_from_pdf(filepath)
        if len(raw_text) < 100:
            print("[OCR] PDF yielded < 100 chars text. Trying image conversion + OCR...")
            if convert_from_path:
                try:
                    # Fallback to Poppler conversion
                    poppler_fallback = r"C:\poppler\Library\bin"
                    kwargs = {}
                    if os.path.exists(poppler_fallback):
                        kwargs["poppler_path"] = poppler_fallback
                    images = convert_from_path(filepath, **kwargs)
                    ocr_text_list = [ocr_image(np.array(img) if cv2 else img) for img in images]
                    raw_text = "\n".join(ocr_text_list)
                except Exception as e:
                    print(f"[OCR] pdf2image conversion error: {e}")
    else:
        raw_text = ocr_image(filepath)

    return raw_text


def parse_line_for_test(line):
    """Parse line for test pattern: name ... numeric_value unit."""
    line = line.strip()
    if not line:
        return None

    # Pattern matches: Test Name (letters/spaces/parens) followed by number and unit
    # e.g., "Hemoglobin 13.5 g/dL" or "WBC: 6.5 x10^9/L" or "FBS ... 95 mg/dL"
    pattern = r"^([A-Za-z0-9\s\(\)\/\-\.\:]+?)[\s\:\.\_]+(\d+(?:\.\d+)?)\s*([a-zA-Z0-9\%\^\/]+)?$"
    match = re.search(pattern, line)
    if match:
        name_part = match.group(1).strip(" :._-")
        val_part = float(match.group(2))
        unit_part = match.group(3) or ""
        if len(name_part) >= 2:
            return name_part, val_part, unit_part

    # Secondary regex attempt
    pattern2 = r"([A-Za-z\s\(\)]+)\s+(\d+(?:\.\d+)?)"
    match2 = re.search(pattern2, line)
    if match2:
        name_part = match2.group(1).strip()
        val_part = float(match2.group(2))
        if len(name_part) >= 2 and not name_part.lower().startswith("page"):
            return name_part, val_part, ""

    return None


def classify_result(ref_row, val):
    """Classify value into Normal, Borderline, or Critical."""
    norm_min = ref_row.get("normal_min")
    norm_max = ref_row.get("normal_max")
    crit_low = ref_row.get("critical_low")
    crit_high = ref_row.get("critical_high")

    # Critical checks
    if crit_low is not None and val < crit_low:
        return "Critical"
    if crit_high is not None and val > crit_high:
        return "Critical"

    # Normal checks
    is_normal = True
    if norm_min is not None and val < norm_min:
        is_normal = False
    if norm_max is not None and val > norm_max:
        is_normal = False

    if is_normal:
        return "Normal"
    else:
        return "Borderline"


def match_and_analyze_text(raw_text, user_gender="Both"):
    """Parse text lines, fuzzy match against CSV reference names, classify."""
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    results = []
    unmatched_lines = []

    for line in lines:
        parsed = parse_line_for_test(line)
        if not parsed:
            if len(line) > 3:
                unmatched_lines.append(line)
            continue

        raw_name, val, raw_unit = parsed

        # Fuzzy match against CSV reference test names
        matched_name = None
        score = 0
        if process and REFERENCE_NAMES:
            best_match = process.extractOne(raw_name, REFERENCE_NAMES)
            if best_match:
                matched_name, score = best_match[0], best_match[1]

        if score >= 80 and matched_name:
            # Find best matching reference row by gender
            matching_rows = [r for r in REFERENCE_ROWS if r["test_name"] == matched_name]
            gender_row = next((r for r in matching_rows if r["gender"].lower() == (user_gender or "").lower()), None)
            if not gender_row:
                gender_row = next((r for r in matching_rows if r["gender"].lower() == "both"), matching_rows[0] if matching_rows else None)

            status = "Normal"
            norm_range_str = "N/A"
            unit = raw_unit or (gender_row["unit"] if gender_row else "")

            if gender_row:
                status = classify_result(gender_row, val)
                n_min = gender_row["normal_min"] if gender_row["normal_min"] is not None else ""
                n_max = gender_row["normal_max"] if gender_row["normal_max"] is not None else ""
                norm_range_str = f"{n_min}-{n_max}" if (n_min or n_max) else "N/A"

            results.append({
                "test_name": matched_name,
                "value": val,
                "unit": unit,
                "status": status,
                "normal_range": norm_range_str
            })
        else:
            unmatched_lines.append(line)

    return results, unmatched_lines


@report_bp.route("/upload", methods=["POST"])
@jwt_required()
def upload_report():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF, JPG, and PNG are allowed."}), 400

    try:
        ext = file.filename.rsplit(".", 1)[1].lower()
        filename = f"{uuid.uuid4().hex}.{ext}"
        upload_folder = current_app.config["UPLOAD_FOLDER"]
        filepath = os.path.join(upload_folder, filename)
        file.save(filepath)

        file_url = f"/uploads/reports/{filename}"

        # Execute OCR and parsing safely
        raw_text = process_report_file(filepath, ext)
        results_data, unmatched = match_and_analyze_text(raw_text, user.gender)

        # Determine overall status
        if not results_data:
            overall_status = "Unreadable"
        else:
            statuses = [r["status"] for r in results_data]
            if "Critical" in statuses:
                overall_status = "Critical"
            elif "Borderline" in statuses:
                overall_status = "Borderline"
            else:
                overall_status = "Normal"

        # Save Report to DB
        report = Report(
            user_id=user_id,
            file_url=file_url,
            overall_status=overall_status
        )
        db.session.add(report)
        db.session.flush()

        # Save test results
        for item in results_data:
            res_row = ReportTestResult(
                report_id=report.id,
                test_name=item["test_name"],
                value=item["value"],
                unit=item["unit"],
                status=item["status"]
            )
            db.session.add(res_row)

        db.session.commit()

        return jsonify({
            "report_id": report.id,
            "overall_status": overall_status,
            "results": results_data,
            "unmatched_lines": unmatched
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"[REPORT UPLOAD ERROR] {e}")
        return jsonify({"error": "An error occurred while processing the report. Please try again."}), 500


@report_bp.route("/<report_id>", methods=["GET"])
@jwt_required()
def get_report(report_id):
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    report = Report.query.get(report_id)

    if not report:
        return jsonify({"error": "Report not found"}), 404

    if report.user_id != user_id:
        return jsonify({"error": "Forbidden: You do not have permission to view this report"}), 403

    results = []
    for r in report.test_results:
        # Match back against reference range for normal_range string
        matching_rows = [row for row in REFERENCE_ROWS if row["test_name"] == r.test_name]
        g_row = next((row for row in matching_rows if row["gender"].lower() == (user.gender or "").lower()), None) if user else None
        if not g_row:
            g_row = next((row for row in matching_rows if row["gender"].lower() == "both"), matching_rows[0] if matching_rows else None)

        norm_range_str = "N/A"
        if g_row:
            n_min = g_row["normal_min"] if g_row["normal_min"] is not None else ""
            n_max = g_row["normal_max"] if g_row["normal_max"] is not None else ""
            norm_range_str = f"{n_min}-{n_max}" if (n_min or n_max) else "N/A"

        results.append({
            "test_name": r.test_name,
            "value": r.value,
            "unit": r.unit,
            "status": r.status,
            "normal_range": norm_range_str
        })

    return jsonify({
        "report_id": report.id,
        "overall_status": report.overall_status,
        "uploaded_at": report.uploaded_at.isoformat(),
        "file_url": report.file_url,
        "results": results,
        "unmatched_lines": []
    }), 200


@report_bp.route("", methods=["GET"])
@jwt_required()
def list_reports():
    user_id = get_jwt_identity()
    reports = Report.query.filter_by(user_id=user_id).order_by(Report.uploaded_at.desc()).all()

    items = [
        {
            "id": r.id,
            "uploaded_at": r.uploaded_at.isoformat(),
            "overall_status": r.overall_status,
            "file_url": r.file_url
        }
        for r in reports
    ]

    return jsonify({"reports": items}), 200
