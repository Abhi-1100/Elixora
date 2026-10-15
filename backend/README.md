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

Medicine Analyzer accepts JPG/JPEG, PNG, WEBP, BMP, TIFF, GIF, HEIC/HEIF, and AVIF images up to 10 MB. The backend validates and normalizes uploads to JPEG before sending them to the analyzer, including phone photos in HEIC/HEIF format. Pillow and `pillow-heif` are required for this conversion. Analysis also uses the separate Medicine AI FastAPI service by default at `http://127.0.0.1:8000`. To override it, set `MEDICINE_AI_API_URL` in the backend environment; `MEDICINE_AI_TIMEOUT_SECONDS` optionally controls the upstream read timeout (default `120`). Keep these server-side; do not use `NEXT_PUBLIC_*` variables for this service URL.

### Optional email and SMS test-alert delivery

After the user confirms **Send Now**, SOS submits alerts through the saved
contacts' enabled email and SMS channels, then offers a prepared WhatsApp draft.
The user must press **Send** in WhatsApp; opening a draft is not delivery.
**Send test alert** in Settings also uses the configured email/SMS providers.
These channels require provider credentials and account authorization; provider
acceptance does not confirm final delivery. Configure either or both providers
in `backend/.env`, then restart Flask. The backend loads this file from its own
directory regardless of the shell's current working directory:

```dotenv
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+15551234567

SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=alerts@example.com
```

### Critical lab report notifications

When analysis marks one or more results **Critical**, Elixora creates a concise
summary using only those analyzed findings and automatically emails contacts
whose **Email alerts** setting is enabled. The email includes the test, measured
value, severity relative to the listed range when determinable, and a general
urgent-care recommendation. It does not include an invented diagnosis. Critical
report email never uses Twilio SMS.

Configure a TLS SMTP account in `backend/.env` (SMTP is preferred over SendGrid):

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-account@gmail.com
SMTP_PASSWORD=your-provider-app-password
SMTP_FROM=your-account@gmail.com
```

For Gmail, use an App Password where supported; do not put the account password
or SMTP credentials in frontend variables. Port 587 uses STARTTLS; port 465 uses
implicit TLS. If SMTP is not configured, the existing SendGrid email settings
above can be used as a fallback. An email is reported as accepted only when the
SMTP server or email provider accepts the request; this does not confirm inbox
delivery.

The report UI can also prepare a WhatsApp message for saved contacts with
**Phone alerts** enabled and a valid phone number. WhatsApp opens with a draft;
the user must review it and press **Send**. The application does not claim to
send WhatsApp messages automatically.

For SMS on existing SOS and test-alert flows, create a Twilio account, configure an SMS-capable sender number, and
copy the Account SID and Auth Token from the Twilio Console. Sender and
destination numbers must use E.164 format (for example, `+14155550123`). A
10-digit contact number is interpreted as an Indian number (`+91`). Trial
accounts may only message destination numbers verified in Twilio, and country
registration/sender rules may apply.

The SendGrid fallback email integration uses the Twilio SendGrid Email API (`POST
/v3/mail/send`), authenticated with a SendGrid API key that has Mail Send
permission. This is separate from the Twilio SMS Account SID and Auth Token:
Twilio SMS credentials do not enable email sending. Complete SendGrid account
activation and domain/sender authentication, then use the authenticated sender
as `SENDGRID_FROM_EMAIL`. SendGrid will reject unverified senders. Keep the API
key server-side. When `SMTP_HOST` and `SMTP_FROM` are configured, SMTP is used
for email instead of SendGrid, including email in SOS and test alerts.

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

In Settings → Emergency contacts, save trusted contacts with a valid email
and/or phone number and enable the relevant alert settings. Email alerts control
automatic critical-report email; Phone alerts controls WhatsApp draft eligibility
and the existing SMS alerts for SOS/test flows.
**Send test alert** sends a real, clearly marked message to every saved contact
who opted in; it is authenticated and rate-limited. Do not use a contact unless
they have agreed to receive alerts.

After the user confirms **Send Now**, the browser requests location permission.
The backend attempts enabled SMS/email channels for saved contacts. If the
provider accepts the request, final delivery is still not guaranteed. The browser
then lets the user pick a saved WhatsApp contact and opens a prefilled SOS draft;
the user must press **Send** in WhatsApp. If location is denied or unavailable,
the SOS can continue without a map link.
The separate Call Emergency Services action confirms before opening `tel:112`
for India. SOS and test-alert provider submissions are authenticated and
rate-limited. Provider requests have a 10-second timeout.
SMTP variables configure TLS email delivery; Twilio variables are for the
existing SMS channel. `TWILIO_FROM` is accepted only as a fallback when
`TWILIO_PHONE_NUMBER` is unset; prefer
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
fetch("http://localhost:5001/api/auth/me", {
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
