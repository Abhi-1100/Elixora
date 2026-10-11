import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import app as app_module
from app import create_app


class AppConfigurationTests(unittest.TestCase):
    def test_backend_environment_loader_uses_absolute_backend_path_outside_cwd(self):
        with tempfile.TemporaryDirectory() as temp_dir:
            temp_path = Path(temp_dir)
            backend_env = temp_path / "backend" / ".env"
            unrelated_cwd = temp_path / "launch-directory"
            backend_env.parent.mkdir()
            unrelated_cwd.mkdir()
            backend_env.write_text("SOS_ENV_PROBE=loaded-from-backend\n", encoding="utf-8")
            (unrelated_cwd / ".env").write_text(
                "SOS_ENV_PROBE=loaded-from-cwd\n",
                encoding="utf-8",
            )

            with (
                patch.dict(os.environ, {}, clear=True),
                patch.object(app_module, "BACKEND_ENV_FILE", backend_env),
                patch("pathlib.Path.cwd", return_value=unrelated_cwd),
            ):
                app_module.load_backend_environment()
                self.assertEqual(os.environ["SOS_ENV_PROBE"], "loaded-from-backend")

    def test_application_rejects_missing_or_example_auth_secrets(self):
        invalid_secret_sets = (
            {"JWT_SECRET_KEY": "", "SECRET_KEY": ""},
            {
                "JWT_SECRET_KEY": "replace-with-a-unique-random-secret",
                "SECRET_KEY": "replace-with-a-different-random-secret",
            },
            {
                "JWT_SECRET_KEY": "same-secret-that-is-long-enough-to-be-insecure",
                "SECRET_KEY": "same-secret-that-is-long-enough-to-be-insecure",
            },
        )
        for secrets in invalid_secret_sets:
            with self.subTest(secrets=tuple(secrets.values())), patch.dict(os.environ, secrets):
                with self.assertRaisesRegex(RuntimeError, "unique JWT_SECRET_KEY"):
                    create_app()


if __name__ == "__main__":
    unittest.main()
