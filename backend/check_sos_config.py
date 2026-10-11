"""Print SOS configuration readiness without exposing credential values."""

import json
import os

from app import BACKEND_ENV_FILE
from app.services.notifier import (
    configured_channels,
    environment_variable_status,
    provider_configuration_issues,
    twilio_sender_alias_conflicts,
    twilio_sender_setting,
)


def main() -> None:
    sender = os.getenv("SENDGRID_FROM_EMAIL", "").strip().lower()
    sender_variable, _ = twilio_sender_setting()
    result = {
        "env_file_exists": BACKEND_ENV_FILE.is_file(),
        "env_file_path": str(BACKEND_ENV_FILE),
        "variables_present": environment_variable_status(),
        "twilio_sender_source": sender_variable if os.getenv(sender_variable, "").strip() else None,
        "legacy_twilio_from_present": bool(os.getenv("TWILIO_FROM", "").strip()),
        "twilio_sender_alias_conflicts": twilio_sender_alias_conflicts(),
        "sendgrid_sender_matches_expected": (
            sender == "khenipriya228@gmail.com"
        ),
        "provider_ready": configured_channels(),
        "configuration_issues": {
            channel: provider_configuration_issues(channel)
            for channel in ("sms", "email")
        },
        "provider_account_verification": (
            "Not checked; verify sender/number in provider consoles and use "
            "authorized test recipients."
        ),
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
