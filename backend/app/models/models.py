from app import db
from datetime import datetime
import uuid


def generate_uuid():
    return str(uuid.uuid4())


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(20), nullable=True)  # Male / Female / Other
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    chat_sessions = db.relationship("ChatSession", backref="user", cascade="all, delete-orphan")
    reports = db.relationship("Report", backref="user", cascade="all, delete-orphan")
    medicine_scans = db.relationship("MedicineScan", backref="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "age": self.age,
            "gender": self.gender,
            "created_at": self.created_at.isoformat(),
        }


class ChatSession(db.Model):
    __tablename__ = "chat_sessions"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    title = db.Column(db.String(255), default="New conversation")
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    messages = db.relationship("ChatMessage", backref="session", cascade="all, delete-orphan")


class ChatMessage(db.Model):
    __tablename__ = "chat_messages"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    session_id = db.Column(db.String(36), db.ForeignKey("chat_sessions.id"), nullable=False)
    sender = db.Column(db.String(10), nullable=False)  # "user" or "ai"
    message = db.Column(db.Text, nullable=False)
    urgency_level = db.Column(db.String(30), nullable=True)  # Low / Moderate / Seek care soon / Emergency
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Report(db.Model):
    __tablename__ = "reports"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    file_url = db.Column(db.String(500), nullable=False)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    overall_status = db.Column(db.String(30), nullable=True)  # Normal / Borderline / Critical

    test_results = db.relationship("ReportTestResult", backref="report", cascade="all, delete-orphan")


class ReportTestResult(db.Model):
    __tablename__ = "report_test_results"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    report_id = db.Column(db.String(36), db.ForeignKey("reports.id"), nullable=False)
    test_name = db.Column(db.String(120), nullable=False)
    value = db.Column(db.Float, nullable=True)
    unit = db.Column(db.String(30), nullable=True)
    status = db.Column(db.String(30), nullable=True)  # Normal / Borderline / Critical


class MedicineScan(db.Model):
    __tablename__ = "medicine_scans"

    id = db.Column(db.String(36), primary_key=True, default=generate_uuid)
    user_id = db.Column(db.String(36), db.ForeignKey("users.id"), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    medicine_name = db.Column(db.String(255), nullable=True)
    uses = db.Column(db.Text, nullable=True)
    side_effects = db.Column(db.Text, nullable=True)
    substitutes = db.Column(db.Text, nullable=True)
    scanned_at = db.Column(db.DateTime, default=datetime.utcnow)
