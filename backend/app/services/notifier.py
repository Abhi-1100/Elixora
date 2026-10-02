"""Privacy-safe email/SMS notification helpers for emergency alerts."""

import html
import logging
import os
import re
import smtplib
from email.message import EmailMessage
from datetime import datetime

import requests

logger = logging.getLogger(__name__)

DEFAULT_FROM = "supportproject1100@gmail.com"


def _clean(value, limit=140):
    value = re.sub(r"[\x00-\x1f\x7f]", " ", str(value or ""))
    return html.escape(" ".join(value.split())[:limit])


def build_alert_message(user_name, latitude=None, longitude=None, note=None, test=False):
    name = _clean(user_name, 120) or "Your Elixora contact"
    time_text = datetime.now().astimezone().strftime("%d %b %Y, %I:%M %p %Z")
    location = ""
    if latitude is not None and longitude is not None:
        location = f" Location: https://maps.google.com/?q={latitude},{longitude}"
    note_text = f" Note: {_clean(note)}" if note else ""
    prefix = "TEST — " if test else ""
    english = (
        f"{prefix}{name} triggered an emergency alert in Elixora at {time_text}. "
        "Please contact them immediately or call your local emergency number."
        f"{location}{note_text} This message was sent automatically; Elixora is not an emergency service."
    )
    hindi = (
        f"\n\nहिंदी: {name} ने {time_text} पर Elixora में आपातकालीन अलर्ट शुरू किया है। "
        "कृपया उनसे तुरंत संपर्क करें या अपने स्थानीय आपातकालीन नंबर पर कॉल करें।"
        f"{(' स्थान: Google Maps पर ' + location.split(' Location: ', 1)[1]) if location else ''}"
        f"{(' नोट: ' + _clean(note)) if note else ''} यह संदेश अपने आप भेजा गया है; Elixora आपातकालीन सेवा नहीं है।"
    )
    return english + hindi


def send_email(to, subject, body):
    host = os.getenv("SMTP_HOST")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    port = int(os.getenv("SMTP_PORT", "587"))
    sender = os.getenv("SMTP_FROM", DEFAULT_FROM)
    if not host or not user or not password:
        logger.info("DEV MODE emergency email to %s\nSubject: %s\n\n%s", to, subject, body)
        return True
    try:
        message = EmailMessage()
        message["From"] = sender
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)
        with smtplib.SMTP(host, port, timeout=10) as smtp:
            smtp.starttls()
            smtp.login(user, password)
            smtp.send_message(message)
        return True
    except (OSError, smtplib.SMTPException, ValueError) as error:
        logger.warning("Emergency email delivery failed: %s", error)
        return False


def send_sms(to, body):
    sid = os.getenv("TWILIO_ACCOUNT_SID")
    token = os.getenv("TWILIO_AUTH_TOKEN")
    sender = os.getenv("TWILIO_FROM")
    if not sid or not token or not sender:
        return False
    try:
        response = requests.post(
            f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
            data={"To": to, "From": sender, "Body": body},
            auth=(sid, token), timeout=10,
        )
        return response.ok
    except requests.RequestException as error:
        logger.warning("Emergency SMS delivery failed: %s", error)
        return False
