import ipaddress
import os
from app import create_app, db
from sqlalchemy import text

app = create_app()

def run_migrations():
    with app.app_context():
        # Creates all tables from models if they don't already exist and apply migrations
        try:
            db.create_all()
            with db.engine.connect() as conn:
                conn.execute(text("ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);"))
                conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE;"))
                conn.execute(text("UPDATE users SET profile_complete = (age IS NOT NULL AND gender IS NOT NULL) WHERE profile_complete = FALSE;"))
                conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users (google_id) WHERE google_id IS NOT NULL;"))
                conn.commit()
        except Exception as err:
            app.logger.warning(f"Database initialization / schema migration warning: {err}")

run_migrations()

if __name__ == "__main__":
    # Default to 5001 on macOS to avoid AirPlay conflict on 5000
    port = int(os.environ.get("PORT", 5001))
    host = os.environ.get("HOST", "127.0.0.1").strip() or "127.0.0.1"
    try:
        is_loopback = ipaddress.ip_address(host).is_loopback
    except ValueError:
        is_loopback = host.lower() == "localhost"
    debug_requested = os.environ.get("FLASK_DEBUG", "").strip().lower() in {
        "1",
        "true",
        "yes",
        "on",
    }
    app.run(host=host, debug=debug_requested and is_loopback, port=port)
