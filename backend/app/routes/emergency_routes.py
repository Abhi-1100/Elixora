import re
from datetime import datetime, timedelta

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required

from app import db
from app.models.models import AlertLog, EmergencyContact, User
from app.services.notifier import build_alert_message, send_email, send_sms

emergency_bp = Blueprint("emergency_bp", __name__)
EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"^\+?[0-9]{7,15}$")
TRIGGERS = {"sos_button", "chat_emergency", "test"}


def _user():
    return User.query.filter_by(id=get_jwt_identity()).first()


def _phone(value):
    if value is None or str(value).strip() == "":
        return None
    raw = re.sub(r"[\s().-]", "", str(value).strip())
    if raw.isdigit() and len(raw) == 10:
        raw = "+91" + raw
    elif raw.isdigit():
        raw = "+" + raw
    return raw if PHONE_RE.match(raw) else None


def _contact_payload(data, existing=None):
    data = data if isinstance(data, dict) else {}
    name = str(data.get("name", existing.name if existing else "")).strip()[:120]
    relation = str(data.get("relation", existing.relation if existing else "Friend")).strip()[:40] or "Friend"
    email = data.get("email", existing.email if existing else None)
    email = str(email).strip().lower() if email is not None and str(email).strip() else None
    phone_value = data.get("phone", existing.phone if existing else None)
    phone = _phone(phone_value)
    if not name:
        return None, "Name is required"
    if not email and not phone:
        return None, "Add a valid email or phone number"
    if email and not EMAIL_RE.match(email):
        return None, "Please enter a valid email address"
    if phone_value and not phone:
        return None, "Please enter a valid phone number (10 digits or E.164 format)"
    payload = {
        "name": name, "relation": relation, "email": email, "phone": phone,
        "is_primary": bool(data.get("is_primary", existing.is_primary if existing else False)),
        "notify_email": bool(data.get("notify_email", existing.notify_email if existing else True)),
        "notify_sms": bool(data.get("notify_sms", existing.notify_sms if existing else False)),
    }
    return payload, None


def _rate_limited(user_id):
    latest = AlertLog.query.filter_by(user_id=user_id).order_by(AlertLog.created_at.desc()).first()
    return latest and latest.created_at and datetime.utcnow() - latest.created_at < timedelta(minutes=2)


def _alert(user, trigger, latitude=None, longitude=None, note=None, test=False):
    contacts = EmergencyContact.query.filter_by(user_id=user.id).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.created_at.asc()).all()
    if not contacts:
        return jsonify({"error": "Please add an emergency contact first"}), 400
    if _rate_limited(user.id):
        return jsonify({"error": "Please wait 2 minutes before sending another alert."}), 429

    subject = f"{'TEST: ' if test else ''}Urgent: {user.name} may need help (Elixora alert)"
    body = build_alert_message(user.name, latitude, longitude, note, test=test)
    sent_count = 0
    channels = set()
    for contact in contacts:
        delivered = False
        if contact.notify_email and contact.email:
            if send_email(contact.email, subject, body):
                delivered = True
                channels.add("email")
        if contact.notify_sms and contact.phone:
            if send_sms(contact.phone, body):
                delivered = True
                channels.add("sms")
        if delivered:
            sent_count += 1
    status = "sent" if sent_count == len(contacts) else "partial" if sent_count else "failed"
    log = AlertLog(user_id=user.id, trigger=trigger, contacts_notified=sent_count, channels=",".join(sorted(channels)), status=status)
    db.session.add(log)
    db.session.commit()
    if status == "sent":
        message = f"Emergency notification sent to {sent_count} contact{'s' if sent_count != 1 else ''}."
    elif status == "partial":
        message = f"Emergency notification delivered to {sent_count} of {len(contacts)} contacts."
    else:
        message = "No emergency notification was delivered. Check your email/SMS provider settings."
    return jsonify({"message": message, "contacts_notified": sent_count, "contacts_total": len(contacts), "channels": sorted(channels), "status": status, "alert": log.to_dict()}), 200


@emergency_bp.get("/contacts")
@jwt_required()
def list_contacts():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    contacts = EmergencyContact.query.filter_by(user_id=user.id).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.created_at.asc()).all()
    return jsonify({"contacts": [contact.to_dict() for contact in contacts]}), 200


@emergency_bp.post("/contacts")
@jwt_required()
def create_contact():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    if EmergencyContact.query.filter_by(user_id=user.id).count() >= 5:
        return jsonify({"error": "You can save up to 5 emergency contacts."}), 400
    payload, error = _contact_payload(request.get_json(silent=True) or {})
    if error:
        return jsonify({"error": error}), 400
    contact = EmergencyContact(user_id=user.id, **payload)
    db.session.add(contact)
    db.session.commit()
    return jsonify({"contact": contact.to_dict()}), 201


@emergency_bp.put("/contacts/<contact_id>")
@jwt_required()
def update_contact(contact_id):
    user = _user()
    contact = EmergencyContact.query.filter_by(id=contact_id, user_id=user.id if user else None).first()
    if not contact:
        return jsonify({"error": "Emergency contact not found"}), 404
    payload, error = _contact_payload(request.get_json(silent=True) or {}, contact)
    if error:
        return jsonify({"error": error}), 400
    for key, value in payload.items():
        setattr(contact, key, value)
    db.session.commit()
    return jsonify({"contact": contact.to_dict()}), 200


@emergency_bp.delete("/contacts/<contact_id>")
@jwt_required()
def delete_contact(contact_id):
    user = _user()
    contact = EmergencyContact.query.filter_by(id=contact_id, user_id=user.id if user else None).first()
    if not contact:
        return jsonify({"error": "Emergency contact not found"}), 404
    db.session.delete(contact)
    db.session.commit()
    return jsonify({"message": "Emergency contact removed"}), 200


def _alert_request(trigger):
    data = request.get_json(silent=True) or {}
    latitude, longitude = data.get("latitude"), data.get("longitude")
    if latitude is not None or longitude is not None:
        try:
            latitude, longitude = float(latitude), float(longitude)
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                raise ValueError
        except (TypeError, ValueError):
            return None, None, None, (jsonify({"error": "Location coordinates are invalid"}), 400)
    note = str(data.get("note", "")).strip()
    if len(note) > 140:
        return None, None, None, (jsonify({"error": "Note must be 140 characters or fewer"}), 400)
    return latitude, longitude, note, None


@emergency_bp.post("/emergency/alert")
@jwt_required()
def send_alert():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json(silent=True) or {}
    trigger = data.get("trigger")
    if trigger not in {"sos_button", "chat_emergency"}:
        return jsonify({"error": "Trigger must be sos_button or chat_emergency"}), 400
    latitude, longitude, note, error = _alert_request(trigger)
    if error:
        return error
    return _alert(user, trigger, latitude, longitude, note)


@emergency_bp.post("/emergency/test")
@jwt_required()
def send_test_alert():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    latitude, longitude, note, error = _alert_request("test")
    if error:
        return error
    return _alert(user, "test", latitude, longitude, note, test=True)


@emergency_bp.get("/emergency/alerts")
@jwt_required()
def list_alerts():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    logs = AlertLog.query.filter_by(user_id=user.id).order_by(AlertLog.created_at.desc()).limit(20).all()
    return jsonify({"alerts": [log.to_dict() for log in logs]}), 200
