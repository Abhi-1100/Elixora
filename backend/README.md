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

## 4. Configure environment variables
Copy `.env.example` to `.env` and fill in your real values:
```bash
cp .env.example .env
```
Edit `.env`:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET_KEY` — any long random string (for signing login tokens)
- `SECRET_KEY` — any long random string

## 5. Run the server
```bash
python run.py
```
This automatically creates all the database tables (`users`, `chat_sessions`, `chat_messages`, `reports`, `report_test_results`, `medicine_scans`) on first run.

Server runs at: `http://localhost:5000`

## 6. Test it's working
```bash
curl http://localhost:5000/api/health
```
Should return: `{"status": "ok", "message": "Backend is running"}`

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
