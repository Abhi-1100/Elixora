"""Privacy-conscious email and SMS delivery for emergency alerts."""

import html
import logging
import os
import re
import smtplib
import ssl
from dataclasses import dataclass
from datetime import datetime
from email.message import EmailMessage

from python_http_client.exceptions import HTTPError
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from requests.exceptions import RequestException, Timeout as RequestTimeout
from twilio.base.exceptions import TwilioException, TwilioRestException
from twilio.http.http_client import TwilioHttpClient
from twilio.rest import Client

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
PHONE_RE = re.compile(r"^\+[1-9][0-9]{6,14}$")
PROVIDER_TIMEOUT_SECONDS = 10
SOS_ENVIRONMENT_VARIABLES = (
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASSWORD",
    "SMTP_FROM",
    "TWILIO_ACCOUNT_SID",
    "TWILIO_AUTH_TOKEN",
    "TWILIO_PHONE_NUMBER",
    "SENDGRID_API_KEY",
    "SENDGRID_FROM_EMAIL",
)


@dataclass(frozen=True)
class DeliveryResult:
    accepted: bool
    provider_status: str
    message_id: str | None = None
    error_code: str | None = None


def configured_channels():
    """Return notification providers that have the credentials they need."""
    configuration = _provider_configuration()
    for channel, details in configuration.items():
        if details["missing"]:
            logger.warning(
                "Emergency %s delivery is not configured; missing variables: %s",
                channel,
                ", ".join(details["missing"]),
            )
        if details["invalid"]:
            logger.warning(
                "Emergency %s configuration is invalid: %s",
                channel,
                ", ".join(details["invalid"]),
            )
    return {
        channel: details["configured"]
        for channel, details in configuration.items()
    }


def environment_variable_status():
    """Report whether SOS settings are configured without returning their values."""
    return {
        key: bool(_environment_value(key))
        for key in SOS_ENVIRONMENT_VARIABLES
    }


def _provider_configuration():
    smtp_host = _environment_value("SMTP_HOST")
    smtp_from = _environment_value("SMTP_FROM")
    smtp_user = _environment_value("SMTP_USER")
    smtp_password = _environment_value("SMTP_PASSWORD")
    try:
        smtp_port = int(_environment_value("SMTP_PORT") or "587")
        smtp_port_valid = 1 <= smtp_port <= 65535
    except ValueError:
        smtp_port = 587
        smtp_port_valid = False
    smtp_auth_valid = bool(smtp_user) == bool(smtp_password)
    smtp_configured = bool(
        smtp_host and smtp_from and EMAIL_RE.fullmatch(smtp_from)
        and smtp_port_valid and smtp_auth_valid
    )

    email_api_key = _environment_value("SENDGRID_API_KEY")
    email_sender = _environment_value("SENDGRID_FROM_EMAIL")
    email_missing = [
        key
        for key, value in (
            ("SENDGRID_API_KEY", email_api_key),
            ("SENDGRID_FROM_EMAIL", email_sender),
        )
        if not value
    ]
    email_invalid = (
        ["SENDGRID_FROM_EMAIL"]
        if email_sender and not EMAIL_RE.fullmatch(email_sender)
        else []
    )
    sendgrid_configured = not email_missing and not email_invalid
    if smtp_configured:
        email_configuration = {"configured": True, "provider": "smtp", "missing": [], "invalid": []}
    elif sendgrid_configured:
        email_configuration = {"configured": True, "provider": "sendgrid", "missing": [], "invalid": []}
    else:
        smtp_partial = bool(smtp_host or smtp_from or smtp_user or smtp_password)
        if smtp_partial:
            email_configuration = {
                "configured": False,
                "provider": None,
                "missing": [key for key, present in (("SMTP_HOST", bool(smtp_host)), ("SMTP_FROM", bool(smtp_from))) if not present],
                "invalid": (
                    ["SMTP_PORT"] if not smtp_port_valid else
                    ["SMTP_USER", "SMTP_PASSWORD"] if not smtp_auth_valid else
                    ["SMTP_FROM"] if smtp_from and not EMAIL_RE.fullmatch(smtp_from) else []
                ),
            }
        else:
            email_configuration = {
                "configured": False,
                "provider": None,
                "missing": email_missing,
                "invalid": email_invalid,
            }

    sender_key, sender_value = twilio_sender_setting()
    sms_values = {
        "TWILIO_ACCOUNT_SID": _environment_value("TWILIO_ACCOUNT_SID"),
        "TWILIO_AUTH_TOKEN": _environment_value("TWILIO_AUTH_TOKEN"),
        sender_key: sender_value,
    }
    sms_missing = [
        key for key, value in sms_values.items() if not value
    ]
    sms_sender = sms_values[sender_key]
    sms_invalid = (
        [sender_key]
        if sms_sender and normalize_phone(sms_sender) is None
        else []
    )

    return {
        "email": email_configuration,
        "sms": {
            "configured": not sms_missing and not sms_invalid,
            "missing": sms_missing,
            "invalid": sms_invalid,
        },
    }


def twilio_sender_setting():
    """Prefer the documented variable; accept TWILIO_FROM for older configs."""
    sender = _environment_value("TWILIO_PHONE_NUMBER")
    if sender:
        return "TWILIO_PHONE_NUMBER", sender
    legacy_sender = _environment_value("TWILIO_FROM")
    if legacy_sender:
        return "TWILIO_FROM", legacy_sender
    return "TWILIO_PHONE_NUMBER", ""


def twilio_sender_alias_conflicts():
    """Report conflicting sender settings without returning either number."""
    canonical = normalize_phone(_environment_value("TWILIO_PHONE_NUMBER"))
    legacy = normalize_phone(_environment_value("TWILIO_FROM"))
    return bool(canonical and legacy and canonical != legacy)


def _environment_value(key):
    value = os.getenv(key, "").strip()
    lowered = value.lower()
    if (
        lowered.startswith(("your-", "replace-with-", "change-me", "changeme"))
    ):
        return ""
    return value


def provider_configuration_issues(channel):
    """Return missing or invalid setting names without exposing their values."""
    details = _provider_configuration()[channel]
    return {
        "missing": details["missing"],
        "invalid": details["invalid"],
    }


def normalize_phone(value):
    if value is None:
        return None
    raw = re.sub(r"[\s().-]", "", str(value).strip())
    if raw.startswith("00"):
        raw = "+" + raw[2:]
    elif raw.isdigit():
        raw = "+91" + raw if len(raw) == 10 else "+" + raw
    return raw if PHONE_RE.fullmatch(raw) else None


def _clean(value, limit=120):
    value = re.sub(r"[\x00-\x1f\x7f]", " ", str(value or ""))
    return html.escape(" ".join(value.split())[:limit])


def build_alert_message(user_name, latitude=None, longitude=None, test=False):
    name = _clean(user_name) or "Your Elixora contact"
    time_text = datetime.now().astimezone().strftime("%d %b %Y, %I:%M %p %Z")
    location = ""
    if latitude is not None and longitude is not None:
        location = f" Location: https://maps.google.com/?q={latitude},{longitude}"
    prefix = "TEST — " if test else ""
    return (
        f"{prefix}{name} triggered an emergency alert in Elixora at {time_text}. "
        "Please contact them immediately or call your local emergency number."
        f"{location} This automated alert contains no medical report or symptom details. "
        "Elixora is not an emergency service."
    )


def send_email(to, subject, body):
    api_key = _environment_value("SENDGRID_API_KEY")
    sender = _environment_value("SENDGRID_FROM_EMAIL")
    recipient = str(to or "").strip()
    configuration = _provider_configuration()["email"]
    if configuration["missing"]:
        logger.warning(
            "Emergency email not sent; missing configuration variables: %s",
            ", ".join(configuration["missing"]),
        )
        return DeliveryResult(False, "not_configured", error_code="email_not_configured")
    if configuration["invalid"]:
        logger.warning(
            "Emergency email not sent; invalid configuration: %s",
            ", ".join(configuration["invalid"]),
        )
        return DeliveryResult(
            False,
            "invalid_configuration",
            error_code="invalid_email_sender",
        )
    if not EMAIL_RE.fullmatch(recipient):
        logger.warning("Emergency email not sent; recipient address is invalid")
        return DeliveryResult(False, "invalid_recipient", error_code="invalid_email")

    if configuration["provider"] == "smtp":
        sender = _environment_value("SMTP_FROM").strip()
        host = _environment_value("SMTP_HOST")
        username = _environment_value("SMTP_USER")
        password = _environment_value("SMTP_PASSWORD")
        port = int(_environment_value("SMTP_PORT") or "587")
        message = EmailMessage()
        message["From"] = sender
        message["To"] = recipient
        message["Subject"] = str(subject or "Elixora emergency alert")[:200]
        message.set_content(str(body or ""))
        try:
            if port == 465:
                with smtplib.SMTP_SSL(host, port, timeout=PROVIDER_TIMEOUT_SECONDS, context=ssl.create_default_context()) as client:
                    if username:
                        client.login(username, password)
                    client.send_message(message)
            else:
                with smtplib.SMTP(host, port, timeout=PROVIDER_TIMEOUT_SECONDS) as client:
                    client.ehlo()
                    client.starttls(context=ssl.create_default_context())
                    client.ehlo()
                    if username:
                        client.login(username, password)
                    client.send_message(message)
            logger.info("Emergency SMTP email accepted by server")
            return DeliveryResult(True, "accepted")
        except (smtplib.SMTPException, OSError, TimeoutError, ssl.SSLError) as error:
            logger.warning("Emergency SMTP request failed: error_type=%s", type(error).__name__)
            return DeliveryResult(False, "provider_error", error_code="smtp_request_failed")

    try:
        message = Mail(from_email=sender, to_emails=recipient, subject=subject, plain_text_content=body)
        client = SendGridAPIClient(api_key)
        client.client.timeout = PROVIDER_TIMEOUT_SECONDS
        response = client.send(message)
        request_id = response.headers.get("X-Message-Id") if response.headers else None
        accepted = response.status_code == 202
        status = "accepted" if accepted else "rejected"
        logger.info(
            "Emergency email provider response: status=%s provider_status=%s message_id=%s",
            response.status_code,
            status,
            request_id or "unavailable",
        )
        return DeliveryResult(
            accepted,
            status,
            request_id,
            None if accepted else "email_provider_rejected",
        )
    except HTTPError as error:
        status_code = getattr(error, "status_code", None)
        logger.warning("Emergency email provider error: status=%s", status_code or "unavailable")
        return DeliveryResult(False, "provider_error", error_code=f"sendgrid_http_{status_code or 'error'}")
    except (TimeoutError, RequestTimeout) as error:
        logger.warning("Emergency email request timed out: error_type=%s", type(error).__name__)
        return DeliveryResult(False, "provider_error", error_code="sendgrid_timeout")
    except RequestException as error:
        logger.warning("Emergency email request failed: error_type=%s", type(error).__name__)
        return DeliveryResult(False, "provider_error", error_code="sendgrid_connection_error")
    except (OSError, ValueError, TypeError) as error:
        logger.warning("Emergency email request failed: error_type=%s", type(error).__name__)
        error_code = (
            "sendgrid_connection_error"
            if isinstance(error, OSError)
            else "sendgrid_request_error"
        )
        return DeliveryResult(False, "provider_error", error_code=error_code)


def send_sms(to, body):
    account_sid = _environment_value("TWILIO_ACCOUNT_SID")
    auth_token = _environment_value("TWILIO_AUTH_TOKEN")
    _, sender_value = twilio_sender_setting()
    sender = normalize_phone(sender_value)
    recipient = normalize_phone(to)
    configuration = _provider_configuration()["sms"]
    if configuration["missing"]:
        logger.warning(
            "Emergency SMS not sent; missing configuration variables: %s",
            ", ".join(configuration["missing"]),
        )
        return DeliveryResult(False, "not_configured", error_code="sms_not_configured")
    if configuration["invalid"]:
        logger.warning(
            "Emergency SMS not sent; invalid configuration: %s",
            ", ".join(configuration["invalid"]),
        )
        return DeliveryResult(
            False,
            "invalid_configuration",
            error_code="invalid_sms_sender",
        )
    if not recipient:
        logger.warning("Emergency SMS not sent; recipient phone number is invalid")
        return DeliveryResult(False, "invalid_recipient", error_code="invalid_phone")

    try:
        client = Client(
            account_sid,
            auth_token,
            http_client=TwilioHttpClient(timeout=PROVIDER_TIMEOUT_SECONDS),
        )
        message = client.messages.create(
            to=recipient,
            from_=sender,
            body=body,
        )
        provider_status = str(message.status or "accepted").lower()
        accepted = provider_status in {"accepted", "queued", "sending", "sent"}
        logger.info(
            "Emergency SMS provider response: status=%s message_id=%s",
            provider_status,
            message.sid or "unavailable",
        )
        return DeliveryResult(
            accepted,
            provider_status,
            message.sid,
            None
            if accepted
            else "twilio_delivery_failed"
            if provider_status in {"failed", "undelivered"}
            else "twilio_message_rejected",
        )
    except TwilioRestException as error:
        safe_code = str(error.code) if error.code is not None else "provider_error"
        logger.warning(
            "Emergency SMS provider error: status=%s code=%s",
            error.status or "unavailable",
            safe_code,
        )
        return DeliveryResult(False, "provider_error", error_code=f"twilio_{safe_code}")
    except (TwilioException, RequestException, OSError, ValueError, TypeError) as error:
        logger.warning("Emergency SMS request failed: error_type=%s", type(error).__name__)
        return DeliveryResult(False, "provider_error", error_code="twilio_request_error")
