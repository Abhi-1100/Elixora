import os
import csv
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

db = SQLAlchemy()
jwt = JWTManager()

# ---------------------------------------------------------------------------
# Reference data — loaded once at import time from the CSV.
# Key: (test_name_lower, gender)  →  dict with range info
# We store a flat list so report_routes can fuzzy-match against Test_Name strings.
# ---------------------------------------------------------------------------
REFERENCE_ROWS = []   # list of dicts, one per CSV row
REFERENCE_NAMES = []  # parallel list of just the Test_Name strings (for thefuzz)


def _load_reference_data():
    """Read lab_reference_ranges.csv into REFERENCE_ROWS at startup."""
    csv_path = os.path.join(
        os.path.dirname(__file__),   # backend/app/
        "..", "..", "dataset",
        "lab_reference_ranges.csv",
    )
    csv_path = os.path.normpath(csv_path)

    if not os.path.exists(csv_path):
        print(f"[WARNING] Reference CSV not found at {csv_path}. "
              "Report analysis will not work.")
        return

    with open(csv_path, newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Coerce numeric fields; keep as None if blank
            def _float(v):
                try:
                    return float(v) if v.strip() != "" else None
                except (ValueError, AttributeError):
                    return None

            REFERENCE_ROWS.append({
                "category":      row["Category"].strip(),
                "test_name":     row["Test_Name"].strip(),
                "gender":        row["Gender"].strip(),   # Male / Female / Both
                "normal_min":    _float(row["Normal_Min"]),
                "normal_max":    _float(row["Normal_Max"]),
                "unit":          row["Unit"].strip(),
                "critical_low":  _float(row["Critical_Low"]),
                "critical_high": _float(row["Critical_High"]),
                "notes":         row.get("Notes", "").strip(),
            })
            REFERENCE_NAMES.append(row["Test_Name"].strip())

    print(f"[INFO] Loaded {len(REFERENCE_ROWS)} reference ranges from CSV.")


_load_reference_data()


def create_app():
    app = Flask(__name__)

    # --- Config ---
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        db_path = os.path.join(os.path.dirname(__file__), "..", "elixora.db")
        db_url = f"sqlite:///{os.path.abspath(db_path)}"
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "elixora-jwt-secret-key-2026")
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "elixora-secret-key-2026")

    # Upload folder config
    app.config["UPLOAD_FOLDER"] = os.path.join(
        os.path.dirname(__file__), "..", "uploads", "reports"
    )
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)

    # --- Init extensions ---
    db.init_app(app)
    jwt.init_app(app)

    # Allow requests from your Next.js frontend (update origin for production)
    CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

    # Load the model artifacts once per Flask application instance.
    from app.services.symptom_predictor import init_symptom_predictor
    init_symptom_predictor(app)
    from app.routes.chat_routes import init_multilang_predictor
    init_multilang_predictor(app)

    # --- Register blueprints (routes) ---
    from app.routes.auth_routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix="/api/auth")

    from app.routes.report_routes import report_bp
    app.register_blueprint(report_bp, url_prefix="/api/reports")

    from app.routes.chat_routes import chat_bp
    app.register_blueprint(chat_bp, url_prefix="/api/chat")

    # --- Serve uploaded report files for the frontend preview panel ---
    from flask import send_from_directory as _send

    @app.route("/uploads/reports/<path:filename>")
    def serve_report_file(filename):
        res = _send(app.config["UPLOAD_FOLDER"], filename)
        res.headers["Access-Control-Allow-Origin"] = "*"
        return res

    # --- Simple health check route ---
    @app.route("/api/health")
    def health_check():
        return {"status": "ok", "message": "Backend is running"}, 200

    return app
