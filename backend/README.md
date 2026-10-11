# MediGuide AI — Backend (Auth + Database Setup)

## 1. Prerequisites
- Python 3.10+
- PostgreSQL installed and running locally (or use a free hosted DB like Neon/Supabase/Railway if you don't want to install Postgres locally — recommended for easier setup)

## 2. Install PostgreSQL & create the database
If installing locally:
```bash
# after installing postgres, open the psql shell
psql -U postgres
CREATE DATABASE medi_guide_db;
\q
```

If using a hosted free service (Neon.tech, Supabase, or Railway) — just create a project there and copy the connection string they give you.

## 3. Set up the backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Google Sign-In additionally requires `google-auth`; it is included in
`requirements.txt` (or install it directly with `pip install google-auth --break-system-packages`).

## 4. Configure environment variables
Copy `.env.example` to `.env` and fill in your real values:
```bash
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET_KEY` — a unique, randomly generated key for signing login tokens
- `SECRET_KEY` — a different unique, randomly generated Flask key
- `GOOGLE_CLIENT_ID` — the same Google OAuth 2.0 Web client ID configured as
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` in the Next.js app
- `GOOGLE_TRANSLATE_API_KEY` — a restricted Google Cloud Translation - Basic API key
  used server-side to translate Hindi/Gujarati voice transcripts into English.

The backend refuses to start if either secret key is missing. Replace the
placeholders with unique values and never commit `backend/.env` or put provider
secrets in `NEXT_PUBLIC_*` variables.

Medicine Analyzer forwards authenticated image uploads to the separate Medicine AI FastAPI service. By default it uses `http://127.0.0.1:8000`. To override it, set `MEDICINE_AI_API_URL` in the backend environment; `MEDICINE_AI_TIMEOUT_SECONDS` optionally controls the upstream read timeout (default `120`). Keep these server-side; do not use `NEXT_PUBLIC_*` variables for this service URL.

### SOS email and SMS delivery

Install the official provider SDKs with `pip install -r requirements.txt`.
Configure either or both providers in `backend/.env`, then restart Flask. The
backend loads this file from its own directory regardless of the shell's
current working directory:

```dotenv
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567

SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=alerts@example.com
```

For SMS, create a Twilio account, configure an SMS-capable sender number, and
copy the Account SID and Auth Token from the Twilio Console. Sender and
destination numbers must use E.164 format (for example, `+14155550123`). A
10-digit contact number is interpreted as an Indian number (`+91`). Trial
accounts may only message destination numbers verified in Twilio, and country
registration/sender rules may apply.

The email integration uses the Twilio SendGrid Email API (`POST
/v3/mail/send`), authenticated with a SendGrid API key that has Mail Send
permission. This is separate from the Twilio SMS Account SID and Auth Token:
Twilio SMS credentials do not enable email sending. Complete SendGrid account
activation and domain/sender authentication, then use the authenticated sender
as `SENDGRID_FROM_EMAIL`. SendGrid will reject unverified senders. Keep the API
key server-side.

### Voice transcript translation

Voice transcripts in Hindi or Gujarati are sent from Flask to the Google Cloud
Translation - Basic v2 API when the user submits a microphone transcript. Enable
Cloud Translation in a billing-enabled Google Cloud project, create an API key
restricted to the Translation API, and set `GOOGLE_TRANSLATE_API_KEY` in
`backend/.env`. The key is sent in the `X-goog-api-key` header and is never
returned to the browser. Without it, the chat still responds using its local
language support and reports that English translation is unavailable. English
transcripts do not require a Translation API request. Machine translation can be
imperfect and should not replace clinical review.

In Settings → Emergency contacts, save each recipient's email and/or phone
number and enable the corresponding Email alerts / SMS alerts checkbox.
**Send test alert** sends a real, clearly marked message to every saved contact
who opted in; it is authenticated and rate-limited. Do not use a contact unless
they have agreed to receive alerts.

The SOS request is sent only after the user confirms **Send Now**. The backend
attempts each opted-in channel independently and reports its configuration,
recipient-validation, and provider-request result. A provider accepting a
request does not confirm final SMS delivery or email arrival; delivery receipts
are not currently tracked. Provider requests have a 10-second timeout, and SOS
submissions include an idempotency key plus a server-side two-minute throttle
to reduce duplicate alerts. Alert content contains the user's name, timestamp,
and optional location only; it excludes free-text notes and medical reports.
Legacy `SMTP_*` values are not used by the emergency notifier. `TWILIO_FROM`
is accepted only as a fallback when `TWILIO_PHONE_NUMBER` is unset; prefer
`TWILIO_PHONE_NUMBER` and ensure the configured sender is authorized for SMS.

If this database already exists, run `migrations/001_google_signin.sql` once
against it before starting the API. New databases get these columns from the
updated model when `db.create_all()` runs.

## 5. Run the server
```bash
python run.py
```
This automatically creates all the database tables (`users`, `chat_sessions`, `chat_messages`, `reports`, `report_test_results`, `medicine_scans`) on first run.

Server runs at: `http://localhost:5001` (or the configured `PORT`)

## 6. Test it's working
```bash
curl http://localhost:5001/api/health
```
Should return: `{"status": "ok", "message": "Backend is running"}`

### Emergency notification tests

Run the mocked provider and authenticated route tests without sending messages:

```bash
cd backend
python -m unittest discover -s tests -p 'test_*.py'
```

## 7. API Endpoints available so far

### Sign up
```
POST /api/auth/signup
Body: { "name": "John", "email": "john@example.com", "password": "secret123", "age": 25, "gender": "Male" }
Returns: { "access_token": "...", "user": {...} }
```

### Log in
```
POST /api/auth/login
Body: { "email": "john@example.com", "password": "secret123" }
Returns: { "access_token": "...", "user": {...} }
```

### Get current logged-in user (protected route)
```
GET /api/auth/me
Header: Authorization: Bearer <access_token>
Returns: { "user": {...} }
```

### Google Sign-In
```
POST /api/auth/google
Body: { "credential": "<Google Identity Services ID token>" }
Returns: { "access_token": "...", "user": {..., "profile_complete": false} }
```

### Complete profile (protected route)
```
PATCH /api/auth/profile
Body: { "age": 25, "gender": "Female" }
Returns: { "user": {..., "profile_complete": true} }
```

## 8. Connecting from your Next.js frontend
On login/signup, store the `access_token` (e.g., in an httpOnly cookie or secure storage), then send it on every future request:
```js
fetch("http://localhost:5000/api/auth/me", {
  headers: { Authorization: `Bearer ${token}` }
})
```

## 9. Folder structure
```
backend/
├── app/
│   ├── __init__.py          # App factory, config, extension setup
│   ├── models/
│   │   └── models.py        # All database tables (User, ChatSession, Report, etc.)
│   └── routes/
│       └── auth_routes.py   # Signup, login, get current user
├── run.py                   # Entry point — run this to start the server
├── requirements.txt
├── .env.example
└── README.md
```

## 10. What's next
Once this is working and you can sign up / log in successfully, the next modules (chatbot, report analyzer, medicine identifier) will each get their own `routes/xxx_routes.py` file and register as a new blueprint in `app/__init__.py` — the structure is already set up to make that a clean addition.
