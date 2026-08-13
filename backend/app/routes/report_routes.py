import os
import re
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

try:
    import pymupdf as fitz  # PyMuPDF >= 1.24
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

try:
    import cv2
    import numpy as np
except ImportError:
    cv2 = None
    np = None

try:
    from rapidocr_onnxruntime import RapidOCR
    rapid_ocr = RapidOCR()
except Exception:
    rapid_ocr = None

try:
    import pytesseract
    if os.name == "nt" and (not pytesseract.pytesseract.tesseract_cmd or pytesseract.pytesseract.tesseract_cmd == "tesseract"):
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

# Alias mapping to handle common lab report test names / abbreviations
TEST_ALIASES = {
    "hemoglobin": "Hemoglobin (Hb)",
    "hb": "Hemoglobin (Hb)",
    "wbc count": "White Blood Cell Count (WBC)",
    "wbccount": "White Blood Cell Count (WBC)",
    "wbc": "White Blood Cell Count (WBC)",
    "white blood cells": "White Blood Cell Count (WBC)",
    "rbc count": "Red Blood Cell Count (RBC)",
    "rbccount": "Red Blood Cell Count (RBC)",
    "rbc": "Red Blood Cell Count (RBC)",
    "red blood cells": "Red Blood Cell Count (RBC)",
    "platelet count": "Platelet Count",
    "plateletcount": "Platelet Count",
    "platelets": "Platelet Count",
    "hematocrit": "Hematocrit (Hct)",
    "hematocrit (hct)": "Hematocrit (Hct)",
    "hct": "Hematocrit (Hct)",
    "fastingbloodsugar": "Fasting Blood Sugar (FBS)",
    "fasting blood sugar": "Fasting Blood Sugar (FBS)",
    "fbs": "Fasting Blood Sugar (FBS)",
    "hba1c": "HbA1c",
    "total cholesterol": "Total Cholesterol",
    "totalcholesterol": "Total Cholesterol",
    "hdlcholesterol": "HDL Cholesterol (Good)",
    "hdl cholesterol": "HDL Cholesterol (Good)",
    "hdl": "HDL Cholesterol (Good)",
    "ldlcholesterol": "LDL Cholesterol (Bad)",
    "ldl cholesterol": "LDL Cholesterol (Bad)",
    "ldl": "LDL Cholesterol (Bad)",
    "triglycerides": "Triglycerides",
    "alt (sgpt)": "ALT (SGPT)",
    "alt": "ALT (SGPT)",
    "sgpt": "ALT (SGPT)",
    "ast (sgot)": "AST (SGOT)",
    "ast": "AST (SGOT)",
    "sgot": "AST (SGOT)",
    "total bilirubin": "Total Bilirubin",
    "direct bilirubin": "Direct Bilirubin",
    "creatinine": "Creatinine",
    "bun": "Blood Urea Nitrogen (BUN)",
    "tsh": "TSH (Thyroid Stimulating Hormone)",
}


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
    """Run RapidOCR (or fallback pytesseract) on image path or numpy array."""
    lines = []
    # 1. Primary engine: RapidOCR
    if rapid_ocr:
        try:
            res, _ = rapid_ocr(image_input)
            if res:
                lines = [item[1].strip() for item in res if item[1].strip()]
                return "\n".join(lines)
        except Exception as e:
            print(f"[OCR] RapidOCR error: {e}")

    # 2. Fallback engine: Pytesseract
    if pytesseract:
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
                processed = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
                text = pytesseract.image_to_string(processed)
            else:
                text = pytesseract.image_to_string(img)
            return text
        except Exception as e:
            print(f"[OCR] Image OCR error: {e}")

    return ""


def process_report_file(filepath, ext):
    """Pipeline: PyMuPDF / RapidOCR -> fallback OCR if needed."""
    raw_text = ""
    if ext == "pdf":
        raw_text = extract_text_from_pdf(filepath)
        if len(raw_text) < 50:
            print("[OCR] PDF yielded < 50 chars text. Trying page rendering + RapidOCR...")
            if fitz:
                try:
                    doc = fitz.open(filepath)
                    ocr_pages = []
                    for page in doc:
                        pix = page.get_pixmap(dpi=150)
                        img_bytes = pix.tobytes("png")
                        if cv2:
                            nparr = np.frombuffer(img_bytes, np.uint8)
                            img_np = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
                            ocr_pages.append(ocr_image(img_np))
                        else:
                            import io
                            from PIL import Image
                            img_pil = Image.open(io.BytesIO(img_bytes))
                            ocr_pages.append(ocr_image(img_pil))
                    doc.close()
                    raw_text = "\n".join(ocr_pages)
                except Exception as e:
                    print(f"[OCR] PyMuPDF page rendering error: {e}")
    else:
        raw_text = ocr_image(filepath)

    return raw_text


def parse_line_for_test(line):
    """Parse single line for test pattern: name ... numeric_value unit."""
    line = line.strip()
    if not line:
        return None

    pattern = r"^([A-Za-z0-9\s\(\)\/\-\.\:]+?)[\s\:\.\_]+(\d+(?:\.\d+)?)\s*([a-zA-Z0-9\%\^\/]+)?$"
    match = re.search(pattern, line)
    if match:
        name_part = match.group(1).strip(" :._-")
        val_part = float(match.group(2))
        unit_part = match.group(3) or ""
        if len(name_part) >= 2:
            return name_part, val_part, unit_part

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

    if crit_low is not None and val < crit_low:
        return "Critical"
    if crit_high is not None and val > crit_high:
        return "Critical"

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
    """Parse text lines (single-line & multi-line OCR layouts), fuzzy match & classify."""
    lines = [l.strip() for l in raw_text.splitlines() if l.strip()]
    results = []
    seen_tests = set()
    unmatched_lines = []

    def get_reference_row(test_name):
        matching_rows = [r for r in REFERENCE_ROWS if r["test_name"] == test_name]
        g_row = next((r for r in matching_rows if r["gender"].lower() == (user_gender or "").lower()), None)
        if not g_row:
            g_row = next((r for r in matching_rows if r["gender"].lower() == "both"), matching_rows[0] if matching_rows else None)
        return g_row

    def clean_candidate_name(name):
        cleaned = re.sub(r"[^a-zA-Z0-9\s\(\)]", "", name).strip()
        return cleaned

    def resolve_test_name(cand):
        c_lower = cand.lower()
        if c_lower in TEST_ALIASES:
            return TEST_ALIASES[c_lower]

        if process and REFERENCE_NAMES:
            best_match = process.extractOne(cand, REFERENCE_NAMES)
            if best_match and best_match[1] >= 65:
                return best_match[0]
        return None

    # Pass 1: Multi-line OCR Table Layout Matching
    for i, line in enumerate(lines):
        # Look for isolated numbers (e.g., "10.2", "142")
        m = re.search(r"^\s*(\d+(?:\.\d+)?)\s*$", line)
        if m:
            val = float(m.group(1))
            possible_name = None
            for j in range(max(0, i - 3), i):
                cand = clean_candidate_name(lines[j])
                if (
                    cand
                    and not re.match(r"^\d", cand)
                    and cand.lower() not in [
                        "result", "unit", "reference range", "referencerange",
                        "test name", "testname", "referring doctor", "patient name",
                        "patient id", "samplecollected", "report date", "age gender"
                    ]
                ):
                    possible_name = cand

            if possible_name:
                matched_name = resolve_test_name(possible_name)
                if matched_name and matched_name not in seen_tests:
                    seen_tests.add(matched_name)
                    unit = ""
                    if i + 1 < len(lines):
                        next_line = lines[i + 1]
                        if re.match(r"^[a-zA-Z0-9\%\^\/]+", next_line) and not re.match(r"^\d", next_line):
                            unit = next_line.rstrip(".")

                    ref_row = get_reference_row(matched_name)
                    status = classify_result(ref_row, val) if ref_row else "Normal"
                    n_min = ref_row["normal_min"] if ref_row and ref_row["normal_min"] is not None else ""
                    n_max = ref_row["normal_max"] if ref_row and ref_row["normal_max"] is not None else ""
                    norm_range_str = f"{n_min}-{n_max}" if (n_min or n_max) else "N/A"
                    final_unit = unit or (ref_row["unit"] if ref_row else "")

                    results.append({
                        "test_name": matched_name,
                        "value": val,
                        "unit": final_unit,
                        "status": status,
                        "normal_range": norm_range_str
                    })
                    continue

    # Pass 2: Single-line regex matching for lines not yet matched
    for line in lines:
        parsed = parse_line_for_test(line)
        if not parsed:
            if len(line) > 3 and not any(k in line.lower() for k in ["patient", "doctor", "report date"]):
                unmatched_lines.append(line)
            continue

        raw_name, val, raw_unit = parsed
        matched_name = resolve_test_name(raw_name)

        if matched_name and matched_name not in seen_tests:
            seen_tests.add(matched_name)
            ref_row = get_reference_row(matched_name)
            status = classify_result(ref_row, val) if ref_row else "Normal"
            n_min = ref_row["normal_min"] if ref_row and ref_row["normal_min"] is not None else ""
            n_max = ref_row["normal_max"] if ref_row and ref_row["normal_max"] is not None else ""
            norm_range_str = f"{n_min}-{n_max}" if (n_min or n_max) else "N/A"
            unit = raw_unit or (ref_row["unit"] if ref_row else "")

            results.append({
                "test_name": matched_name,
                "value": val,
                "unit": unit,
                "status": status,
                "normal_range": norm_range_str
            })

    return results, unmatched_lines[:20]


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
            "file_url": report.file_url,
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
