import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

from flask import Blueprint, jsonify, request
from flask_jwt_extended import get_jwt_identity, jwt_required
from sqlalchemy.exc import IntegrityError

from app import db
from app.models.models import AlertLog, EmergencyContact, User, generate_uuid
from app.services.notifier import (
    EMAIL_RE,
    build_alert_message,
    configured_channels,
    normalize_phone,
    provider_configuration_issues,
    send_email,
    send_sms,
)

emergency_bp = Blueprint("emergency_bp", __name__)
logger = logging.getLogger(__name__)
TRIGGERS = {"sos_button", "chat_emergency", "test"}


def _user():
    return User.query.filter_by(id=get_jwt_identity()).first()


def _phone(value):
    if value is None or str(value).strip() == "":
        return None
    return normalize_phone(value)


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
    for key in ("is_primary", "notify_email", "notify_sms"):
        if key in data and not isinstance(data[key], bool):
            return None, f"{key} must be true or false"
    payload = {
        "name": name, "relation": relation, "email": email, "phone": phone,
        "is_primary": data.get("is_primary", existing.is_primary if existing else False),
        "notify_email": data.get("notify_email", existing.notify_email if existing else True),
        "notify_sms": data.get("notify_sms", existing.notify_sms if existing else False),
    }
    return payload, None


def _rate_limited(user_id, trigger):
    latest = (
        AlertLog.query
        .filter_by(user_id=user_id)
        .filter(AlertLog.status.in_(("sending", "queued", "partial", "sent", "failed")))
        .filter(AlertLog.trigger == "test" if trigger == "test" else AlertLog.trigger != "test")
        .order_by(AlertLog.created_at.desc())
        .first()
    )
    if not latest or not latest.created_at:
        return False
    created_at = latest.created_at
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    return datetime.now(timezone.utc) - created_at < timedelta(minutes=2)


def _duplicate_alert_response():
    return jsonify({
        "error": "This alert request is already in progress or was already submitted.",
        "status": "duplicate",
    }), 409


def _alert(user, trigger, latitude=None, longitude=None, test=False, idempotency_key=None):
    user = User.query.filter_by(id=user.id).with_for_update().first()
    if not user:
        return jsonify({"error": "User not found"}), 404

    contacts = EmergencyContact.query.filter_by(user_id=user.id).order_by(EmergencyContact.is_primary.desc(), EmergencyContact.created_at.asc()).all()
    if not contacts:
        provider_status = configured_channels()
        return jsonify({
            "error": "Please add an emergency contact first",
            "status": "failed",
            "channel_results": {
                channel: {
                    "requested": 0,
                    "attempted": 0,
                    "accepted": 0,
                    "failed": 0,
                    "invalid": 0,
                    "configured": provider_status[channel],
                    "status": "not_requested",
                    "errors": [],
                }
                for channel in ("sms", "email")
            },
        }), 400
    if idempotency_key and AlertLog.query.filter_by(id=idempotency_key).first():
        return _duplicate_alert_response()
    if _rate_limited(user.id, trigger):
        return jsonify({"error": "Please wait 2 minutes before sending another alert."}), 429

    log = AlertLog(
        id=idempotency_key or generate_uuid(),
        user_id=user.id,
        trigger=trigger,
        contacts_notified=0,
        channels="",
        status="sending",
    )
    db.session.add(log)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return _duplicate_alert_response()

    body = build_alert_message(user.name, latitude, longitude, test=test)
    attempted = 0
    accepted = 0
    accepted_contacts = 0
    accepted_channels = set()
    unavailable_channels = set()
    failed_channels = set()
    invalid_channels = set()
    provider_status = configured_channels()
    channel_results = {
        channel: {
            "requested": 0,
            "attempted": 0,
            "accepted": 0,
            "failed": 0,
            "invalid": 0,
            "configured": available,
            "errors": [],
        }
        for channel, available in provider_status.items()
    }
    email_available = provider_status["email"]
    sms_available = provider_status["sms"]
    eligible_contacts = 0

    for contact in contacts:
        contact_eligible = False
        contact_accepted = False
        if contact.notify_email:
            channel_results["email"]["requested"] += 1
            if contact.email:
                contact_eligible = True
                if not EMAIL_RE.fullmatch(contact.email.strip()):
                    logger.warning(
                        "Emergency email alert skipped because a saved recipient address is invalid"
                    )
                    unavailable_channels.add("email")
                    invalid_channels.add("email")
                    channel_results["email"]["invalid"] += 1
                    channel_results["email"]["errors"].append("invalid_recipient:email")
                elif not email_available:
                    unavailable_channels.add("email")
                    failed_channels.add("email")
                    channel_results["email"]["failed"] += 1
                    configuration = provider_configuration_issues("email")
                    channel_results["email"]["errors"].extend(
                        f"missing_configuration:{key}" for key in configuration["missing"]
                    )
                    channel_results["email"]["errors"].extend(
                        f"invalid_configuration:{key}" for key in configuration["invalid"]
                    )
                else:
                    attempted += 1
                    channel_results["email"]["attempted"] += 1
                    result = send_email(contact.email, f"{'TEST: ' if test else ''}Elixora emergency alert", body)
                    if result.accepted:
                        accepted += 1
                        channel_results["email"]["accepted"] += 1
                        contact_accepted = True
                        accepted_channels.add("email")
                    else:
                        channel_results["email"]["failed"] += 1
                        failed_channels.add("email")
                        error_type = (
                            "invalid_recipient"
                            if result.provider_status == "invalid_recipient"
                            else "invalid_configuration"
                            if result.provider_status == "invalid_configuration"
                            else "provider_error"
                            if result.provider_status == "provider_error"
                            else "provider_rejected"
                        )
                        channel_results["email"]["errors"].append(
                            f"{error_type}:{result.error_code or result.provider_status}"
                        )
            else:
                logger.warning(
                    "Emergency email alert skipped because an opted-in contact has no email address"
                )
                unavailable_channels.add("email")
                invalid_channels.add("email")
                channel_results["email"]["invalid"] += 1
                channel_results["email"]["errors"].append("invalid_recipient:email")
        if contact.notify_sms:
            channel_results["sms"]["requested"] += 1
            if contact.phone:
                contact_eligible = True
                if normalize_phone(contact.phone) is None:
                    logger.warning(
                        "Emergency SMS alert skipped because a saved recipient phone number is invalid"
                    )
                    unavailable_channels.add("sms")
                    invalid_channels.add("sms")
                    channel_results["sms"]["invalid"] += 1
                    channel_results["sms"]["errors"].append("invalid_recipient:sms")
                elif not sms_available:
                    unavailable_channels.add("sms")
                    failed_channels.add("sms")
                    channel_results["sms"]["failed"] += 1
                    configuration = provider_configuration_issues("sms")
                    channel_results["sms"]["errors"].extend(
                        f"missing_configuration:{key}" for key in configuration["missing"]
                    )
                    channel_results["sms"]["errors"].extend(
                        f"invalid_configuration:{key}" for key in configuration["invalid"]
                    )
                else:
                    attempted += 1
                    channel_results["sms"]["attempted"] += 1
                    result = send_sms(contact.phone, body)
                    if result.accepted:
                        accepted += 1
                        channel_results["sms"]["accepted"] += 1
                        contact_accepted = True
                        accepted_channels.add("sms")
                    else:
                        channel_results["sms"]["failed"] += 1
                        failed_channels.add("sms")
                        if result.error_code == "invalid_phone":
                            unavailable_channels.add("sms")
                            invalid_channels.add("sms")
                            channel_results["sms"]["invalid"] += 1
                        error_type = (
                            "invalid_recipient"
                            if result.provider_status == "invalid_recipient"
                            else "invalid_configuration"
                            if result.provider_status == "invalid_configuration"
                            else "delivery_failure"
                            if result.error_code == "twilio_delivery_failed"
                            else "provider_error"
                            if result.provider_status == "provider_error"
                            else "provider_rejected"
                        )
                        channel_results["sms"]["errors"].append(
                            f"{error_type}:{result.error_code or result.provider_status}"
                        )
            else:
                logger.warning(
                    "Emergency SMS alert skipped because an opted-in contact has no phone number"
                )
                unavailable_channels.add("sms")
                invalid_channels.add("sms")
                channel_results["sms"]["invalid"] += 1
                channel_results["sms"]["errors"].append("invalid_recipient:sms")
        if contact_eligible:
            eligible_contacts += 1
        if contact_accepted:
            accepted_contacts += 1

    if eligible_contacts == 0:
        for counts in channel_results.values():
            counts["status"] = "not_requested" if counts["requested"] == 0 else "failed"
        log.status = "failed"
        db.session.commit()
        return jsonify({
            "error": "No enabled notification channel has a valid saved contact address.",
            "status": "failed",
            "channel_results": channel_results,
            "alert": log.to_dict(),
        }), 400
    has_failures = bool(failed_channels or invalid_channels)
    status = (
        "failed"
        if accepted == 0
        else "partial"
        if accepted < attempted or has_failures
        else "queued"
    )
    log.contacts_notified = accepted_contacts
    log.channels = ",".join(sorted(accepted_channels))
    log.status = status
    db.session.commit()

    if status == "queued":
        message = (
            f"Alert accepted by the configured provider(s) for {accepted_contacts} contact"
            f"{'s' if accepted_contacts != 1 else ''}. Delivery is not confirmed."
        )
    elif status == "partial":
        message = (
            f"Providers accepted {accepted} of {attempted} notification request(s) for "
            f"{accepted_contacts} contact(s). Delivery is not confirmed."
        )
    else:
        message = "No notification request was accepted by a provider. Check the channel setup and contact details."
    email_configuration = provider_configuration_issues("email")
    sms_configuration = provider_configuration_issues("sms")
    if "email" in unavailable_channels and not email_available:
        if email_configuration["missing"]:
            message += (
                " Email is not configured; missing "
                + ", ".join(email_configuration["missing"])
                + " in backend/.env."
            )
        if email_configuration["invalid"]:
            message += (
                " Email configuration is invalid: "
                + ", ".join(email_configuration["invalid"])
                + "."
            )
    if "sms" in unavailable_channels and not sms_available:
        if sms_configuration["missing"]:
            message += (
                " SMS is not configured; missing "
                + ", ".join(sms_configuration["missing"])
                + " in backend/.env."
            )
        if sms_configuration["invalid"]:
            message += (
                " SMS configuration is invalid: "
                + ", ".join(sms_configuration["invalid"])
                + "."
            )
    if "email" in failed_channels and email_available:
        message += " Email provider request failed; check the SendGrid sender verification and account status."
    if "sms" in failed_channels and sms_available:
        message += " SMS provider request failed; check the Twilio sender, account status, and trial recipient verification."
    if invalid_channels:
        message += " Check that each enabled notification channel has a valid saved contact address."
    for counts in channel_results.values():
        if counts["requested"] == 0:
            counts["status"] = "not_requested"
        elif counts["accepted"] > 0 and counts["failed"] == 0 and counts["invalid"] == 0:
            counts["status"] = "provider_accepted"
        elif counts["accepted"] > 0:
            counts["status"] = "partial"
        elif not counts["configured"]:
            counts["status"] = "not_configured"
        else:
            counts["status"] = "failed"
    if unavailable_channels.intersection({"email", "sms"}) and eligible_contacts and not attempted:
        status = "failed"
        log.status = status
        db.session.commit()
    return jsonify({
        "message": message,
        "status": status,
        "delivery_status": "provider_accepted" if status == "queued" else "partial" if status == "partial" else "not_accepted",
        "contacts_notified": accepted_contacts,
        "contacts_accepted": accepted_contacts,
        "contacts_total": eligible_contacts,
        "messages_accepted": accepted,
        "messages_attempted": attempted,
        "channels": sorted(accepted_channels),
        "unavailable_channels": sorted(unavailable_channels),
        "failed_channels": sorted(failed_channels),
        "invalid_channels": sorted(invalid_channels),
        "channel_results": channel_results,
        "alert": log.to_dict(),
    }), 200


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


def _alert_request():
    data = request.get_json(silent=True)
    if data is None:
        data = {}
    if not isinstance(data, dict):
        return None, None, (jsonify({"error": "A JSON object is required."}), 400)
    latitude, longitude = data.get("latitude"), data.get("longitude")
    if latitude is not None or longitude is not None:
        try:
            if (
                isinstance(latitude, bool)
                or isinstance(longitude, bool)
                or not isinstance(latitude, (int, float))
                or not isinstance(longitude, (int, float))
            ):
                raise ValueError
            latitude, longitude = float(latitude), float(longitude)
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                raise ValueError
        except (TypeError, ValueError):
            return None, None, (jsonify({"error": "Location coordinates are invalid"}), 400)
    if len(str(data.get("note", "")).strip()) > 140:
        return None, None, (jsonify({"error": "Note must be 140 characters or fewer"}), 400)
    return latitude, longitude, None


@emergency_bp.post("/emergency/alert")
@jwt_required()
def send_alert():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "A JSON object is required."}), 400
    trigger = data.get("trigger")
    if trigger not in {"sos_button", "chat_emergency"}:
        return jsonify({"error": "Trigger must be sos_button or chat_emergency"}), 400
    raw_idempotency_key = request.headers.get("Idempotency-Key")
    try:
        idempotency_key = str(UUID(raw_idempotency_key)) if raw_idempotency_key else None
    except (ValueError, AttributeError):
        return jsonify({"error": "Idempotency-Key must be a UUID."}), 400
    latitude, longitude, error = _alert_request()
    if error:
        return error
    return _alert(user, trigger, latitude, longitude, idempotency_key=idempotency_key)


@emergency_bp.post("/emergency/test")
@jwt_required()
def send_test_alert():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    latitude, longitude, error = _alert_request()
    if error:
        return error
    return _alert(user, "test", latitude, longitude, test=True)


@emergency_bp.get("/emergency/alerts")
@jwt_required()
def list_alerts():
    user = _user()
    if not user:
        return jsonify({"error": "User not found"}), 404
    logs = AlertLog.query.filter_by(user_id=user.id).order_by(AlertLog.created_at.desc()).limit(20).all()
    return jsonify({"alerts": [log.to_dict() for log in logs]}), 200
