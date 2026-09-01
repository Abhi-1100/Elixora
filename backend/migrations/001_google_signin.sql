-- Google Sign-In schema migration for PostgreSQL.
-- Run once against the database configured by DATABASE_URL.

ALTER TABLE users
  ALTER COLUMN password_hash DROP NOT NULL;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET profile_complete = (age IS NOT NULL AND gender IS NOT NULL)
WHERE profile_complete = FALSE;

CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id
  ON users (google_id)
  WHERE google_id IS NOT NULL;
