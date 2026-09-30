# Elixora (MediGuide AI)

Elixora is a full-stack AI healthcare assistant. It provides authentication, symptom/disease prediction, multilingual symptom responses, PDF/image laboratory-report extraction, report history, and an animated voice-oriented UI.

This README is the implementation guide for developers and coding/bug-fixing agents. Read it before changing code. The repository is a work in progress: authentication, symptom prediction, and report upload/analysis are connected to the Flask API; some other UI features are demonstrations.

> Medical safety: this application provides informational guidance only. It is not a diagnosis, medical device, emergency service, or substitute for a licensed clinician. Never remove the disclaimers or emergency-care guidance when changing health-response code.

## Current implementation status

| Area | Status | Source of truth |
|---|---|---|
| Next.js web app | Implemented | `app/`, `components/`, `lib/` |
| Email/password authentication | Implemented | `backend/app/routes/auth_routes.py`, `context/AuthContext.tsx` |
| Google sign-in | Implemented when credentials are configured | `backend/app/routes/auth_routes.py`, `components/auth/google-login-button.tsx` |
| JWT session | Implemented; token is stored in browser `localStorage` | `context/AuthContext.tsx`, `lib/api.js` |
| Unified offline chat routing | Implemented | `POST /api/chat/message`, `backend/app/services/chat_router.py` |
| Symptom prediction | Implemented | `backend/app/services/symptom_predictor.py` and `ml/predict_multilang.py` |
| English/Hindi/Gujarati response formatting | Implemented for `/api/chat/symptom-check` | `ml/i18n/` |
| LLM conversational symptom advisor | Implemented as a separate endpoint when an LLM key is configured | `/api/chat/symptom-advisor` |
| PDF/image lab report upload | Implemented | `backend/app/routes/report_routes.py` |
| OCR and lab-value classification | Implemented with fallbacks | PyMuPDF, RapidOCR/pytesseract, `dataset/lab_reference_ranges.csv` |
| Medicine dataset | Present but not connected to a backend route | `dataset/medicine/medicine_dataset.csv` |
| Persistent chat history | Database models exist, but the current chat page keeps conversations in React state | `backend/app/models/models.py`, `app/chat/page.tsx` |
| Voice input/output | Hooks exist; the main voice page is currently a UI simulation | `hooks/`, `app/voice/page.tsx` |

## Architecture

```text
Browser (Next.js 16 / React 19)
        |
        | JSON + Bearer JWT / multipart upload
        v
Flask API on :5000
  ├── Auth routes      -> users table
  ├── Chat routes      -> local sklearn models and optional LLM
  ├── Report routes    -> OCR + CSV reference ranges -> reports tables
  └── Uploaded files   -> backend/uploads/reports/
        |
        v
SQLite by default, or PostgreSQL when DATABASE_URL is set
```

The frontend API base URL is `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:5000/api`. The Flask app is created in `backend/app/__init__.py`; `backend/run.py` creates/migrates tables and starts port 5000.

## Repository map

### Frontend

- `app/page.tsx` — landing page.
- `app/login/page.tsx` — email/password login and Google login UI.
- `app/signup/page.tsx` — account creation UI.
- `app/complete-profile/page.tsx` — collects age and gender after incomplete sign-in.
- `app/chat/page.tsx` — authenticated chat shell, language selector, attachment upload, report side panel, voice modal, and client-side conversation state.
- `app/reports/page.tsx` — authenticated report list.
- `app/reports/upload/page.tsx` — standalone report upload.
- `app/reports/[id]/page.tsx` and the legacy `.jsx` variant — report detail pages. Inspect both before changing/removing either.
- `app/voice/page.tsx` — full-screen animated voice-mode demonstration.
- `app/layout.tsx` — metadata, theme provider, and auth provider.
- `components/landing/` — landing visuals and feature sections.
- `components/chat/` — sidebar, thread, input, top bar, report panel, and response cards.
- `components/ui/` — reusable visual components and CSS effects.
- `components/voice/voice-mode-modal.tsx` — voice modal embedded in chat.
- `context/AuthContext.tsx` — browser session bootstrap, save, logout, and current-user refresh.
- `hooks/useVoiceInput.ts` and `hooks/useVoiceOutput.ts` — browser speech APIs/helpers.
- `lib/api.js` — single frontend wrapper for all Flask requests.

### Backend

- `backend/run.py` — entry point, `db.create_all()`, non-destructive user migrations, and `app.run(debug=True, port=5000)`.
- `backend/app/__init__.py` — Flask app factory, SQLAlchemy/JWT/CORS setup, model loading, route registration, health endpoint, and static report serving.
- `backend/app/models/models.py` — SQLAlchemy models.
- `backend/app/routes/auth_routes.py` — signup, login, Google login, profile completion, current-user endpoint.
- `backend/app/routes/chat_routes.py` — localized symptom check and optional LLM-backed symptom advisor.
- `backend/app/routes/report_routes.py` — upload, OCR, test-name matching, reference-range classification, report retrieval/listing.
- `backend/app/services/symptom_predictor.py` — root model loader, symptom normalization, validation, and top-N predictions.
- `backend/migrations/001_google_signin.sql` — migration for Google/profile fields.
- `backend/uploads/reports/` — runtime uploads; do not commit user medical files.

### Machine learning and data

- `data_preprocessing.py` — active root-pipeline preprocessing script.
- `train_model.py` — active root-pipeline trainer/evaluator.
- `train_symptom_model.py` — older/alternative Random Forest + `MultiLabelBinarizer` pipeline.
- `processed_data.pkl` — root pipeline processed features, encoded labels, encoder, and feature names.
- `model.pkl` — root pipeline classifier used first by the backend.
- `model_metadata.pkl` — root model label encoder and symptom-column order.
- `disease_info.json` — root model descriptions and precautions generated by preprocessing.
- `ml/predict_multilang.py` — multilingual inference/response formatter loaded by the Flask app.
- `ml/disease_prediction_model.pkl`, `ml/label_encoder.pkl`, `ml/symptom_columns.pkl` — multilingual/legacy model artifacts.
- `ml/i18n/disease_info_multilang.json` — disease name, description, and precautions in English, Hindi, and Gujarati.
- `ml/i18n/ui_strings.json` — localized response templates and disclaimers.
- `dataset/Symptom/` — primary symptom/disease CSVs.
- `dataset/Symptoms Dataset/` — duplicate/legacy copy of the symptom CSV set; verify which copy a script uses before editing it.
- `dataset/lab_reference_ranges.csv` — lab test names, sex-specific ranges, units, critical thresholds, and notes.
- `dataset/medicine/medicine_dataset.csv` — medicine names, substitutes, uses, side effects, and drug-class fields; currently data-only.

## Local setup

### Prerequisites

- Node.js compatible with the installed Next.js version.
- Python 3.10+.
- PostgreSQL is optional. Without `DATABASE_URL`, the backend uses `backend/elixora.db` (SQLite).
- Tesseract OCR is optional but useful as the image/PDF OCR fallback. On Windows the code checks `C:\Program Files\Tesseract-OCR\tesseract.exe`.
- Poppler may be needed by `pdf2image` in environments where PDF rendering fallback is used.

### Frontend

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Useful scripts:

```bash
npm run build
npm run start
npm run lint
```

### Backend (Windows PowerShell)

```powershell
cd backend
py -3 -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python run.py
```

The API runs at `http://localhost:5000`.

### Backend (macOS/Linux)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

Check the service:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{"status":"ok","message":"Backend is running"}
```

## Environment variables

### Frontend `.env.local`

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-web-client-id
```

`NEXT_PUBLIC_GOOGLE_CLIENT_ID` must match the server-side Google client ID. Never put a Google client secret, database password, JWT signing secret, or LLM secret in a `NEXT_PUBLIC_*` variable.

### Backend `.env`

```dotenv
DATABASE_URL=postgresql://user:password@host:5432/elixora
JWT_SECRET_KEY=long-random-secret
SECRET_KEY=long-random-secret
GOOGLE_CLIENT_ID=your-google-web-client-id
OPENAI_API_KEY=optional
LLM_API_KEY=optional-alternative-name
LLM_API_URL=https://api.openai.com/v1/chat/completions
LLM_MODEL=gpt-4o-mini
```

`DATABASE_URL` is optional. The code falls back to SQLite. `OPENAI_API_KEY` or `LLM_API_KEY` activates the optional OpenAI-compatible symptom advisor. The multilingual `/symptom-check` route does not require an LLM key.

The repository ignores `.env*`. If a secret is accidentally exposed, rotate it immediately; do not solve the issue by committing the secret.

## Authentication and session flow

1. The user signs up, logs in, or completes Google sign-in.
2. Flask returns `access_token` and a serialized `user`.
3. `AuthContext.saveSession()` stores the JWT under `localStorage` key `mg_token`.
4. `lib/api.js` sends `Authorization: Bearer <token>` for protected calls.
5. On page load, `AuthContext` calls `GET /api/auth/me`. If it fails, the token is removed.
6. The chat and report pages redirect unauthenticated users to `/login`.

The current storage is browser `localStorage`, not an httpOnly cookie. Preserve this fact when diagnosing authentication or security issues.

## API reference

All paths below are relative to `http://localhost:5000`.

### Health

`GET /api/health` — public health check.

### Authentication

`POST /api/auth/signup` — body: `{ name, email, password, age?, gender? }`. Password must be at least six characters. Returns `access_token` and `user`.

`POST /api/auth/login` — body: `{ email, password }`.

`POST /api/auth/google` — body: `{ credential }`, where `credential` is a Google Identity Services ID token. The backend verifies it against `GOOGLE_CLIENT_ID`.

`GET /api/auth/me` — protected. Returns the current user.

`PATCH /api/auth/profile` — protected. Body: `{ age, gender }`. Age must be an integer from 1 to 120; gender must be `Male`, `Female`, or `Other`.

### Symptom chat

`POST /api/chat/symptom-check` — public route used by the current frontend. Body:

```json
{"symptoms":"fever, headache", "lang":"en"}
```

`symptoms` may also be a non-empty string array. `lang` must be `en`, `hi`, or `gu`. The response contains localized `text`, `disease`, `disease_key`, and percentage `confidence`. Unknown symptoms are reported by the predictor but are not used as model features.

`POST /api/chat/symptom-advisor` — separate public route. Body:

```json
{"message":"I have high fever and headache"}
```

The route extracts known symptoms using exact matching and optional conservative fuzzy matching, predicts up to three possible diseases, assigns `routine`, `seek_care_soon`, or `emergency` urgency, and then calls an OpenAI-compatible API if configured. Without an LLM key, it returns a local safe fallback. This route returns structured predictions and is not the route currently called by `app/chat/page.tsx`.

`POST /api/chat/message` — the unified offline-first route used by the current chat page. It classifies emergency messages before prediction, handles greetings, fuzzy disease-information questions, medicine lookups from `dataset/medicine/medicine_dataset.csv`, free-text symptom extraction, English/Hindi/Gujarati response templates, and a helpful follow-up for unknown input. It does not require an LLM key.

### Reports

All report endpoints are protected with JWT.

`POST /api/reports/upload` — multipart form field `file`; accepts PDF, JPG, JPEG, and PNG. Returns report ID, overall status, source file URL, extracted results, and unmatched lines.

`GET /api/reports` — returns the current user's newest reports.

`GET /api/reports/<report_id>` — returns one report only if it belongs to the current user.

Report status is `Unreadable` when no tests are extracted, otherwise `Critical` if any result is critical, `Borderline` if none are critical but one is borderline, or `Normal` if all extracted values are normal.

## Symptom model: data and training

### Primary data

The root pipeline reads `dataset/Symptom/dataset.csv`:

- 4,920 rows in the current checkout.
- `Disease` target column.
- `Symptom_1` through `Symptom_17` input columns.
- 41 disease classes in the current CSV.
- Blank symptom cells mean the row has fewer symptoms.

The same directory contains:

- `symptom_Description.csv` — one description per disease (41 rows currently).
- `symptom_precaution.csv` — up to four precautions per disease.
- `Symptom-severity.csv` — symptom weights (currently used as reference data, not by the root classifier).

### Root pipeline (`data_preprocessing.py` -> `train_model.py`)

Run from the repository root:

```bash
python data_preprocessing.py
python train_model.py
```

Preprocessing:

1. Reads `dataset/Symptom/dataset.csv`.
2. Finds columns whose names start with `symptom_` case-insensitively.
3. Fills missing cells with empty strings, trims whitespace, and lowercases symptoms.
4. Builds a sorted vocabulary of unique non-empty symptoms.
5. Converts every row to a multi-hot/binary feature vector. A symptom is `1` if it occurs anywhere in that row and `0` otherwise.
6. Encodes disease names with `sklearn.preprocessing.LabelEncoder`.
7. Joins disease descriptions and precaution columns and writes `disease_info.json`.
8. Writes `processed_data.pkl` containing `X`, `y`, the label encoder, and the exact symptom-column order.

Training:

1. Loads `processed_data.pkl`.
2. Performs an 80/20 stratified train/test split with `random_state=42`.
3. Trains `RandomForestClassifier(n_estimators=300, random_state=42, n_jobs=-1, class_weight="balanced")`.
4. Trains `BernoulliNB()` on the same split.
5. Prints accuracy, weighted precision, weighted recall, and weighted F1 for both.
6. Prints the top 15 Random Forest feature importances.
7. Saves whichever model has the higher weighted F1 to `model.pkl`.
8. Saves the encoder and feature order to `model_metadata.pkl`.

Do not change the symptom vocabulary order without regenerating both the model and metadata. Inference constructs a vector using that saved order.

### Active root-model inference

At Flask startup, `SymptomPredictor` first checks for root `model.pkl` and `model_metadata.pkl`. When present, it loads them and optional `disease_info.json`. It normalizes underscores/spaces and case, removes duplicate symptoms, separates unrecognized values, builds a one-hot vector, calls `predict_proba`, and returns the top predictions with descriptions/precautions.

### Multilingual/legacy pipeline (`ml/`)

`ml/predict_multilang.py` loads `ml/disease_prediction_model.pkl`, `ml/label_encoder.pkl`, and `ml/symptom_columns.pkl`. It normalizes input by lowercasing, replacing whitespace and hyphens with underscores, and keeps only exact known features. It predicts one disease, converts model probability to a percentage, and formats localized text from `ml/i18n/`.

The currently registered `/api/chat/symptom-check` endpoint uses this multilingual pipeline. It supports `en`, `hi`, and `gu`; the model features themselves are language-agnostic English symptom keys, while only the display response is localized. Confidence below `40.0%` adds a low-confidence warning.

The older `train_symptom_model.py` is not the same artifact pipeline. It uses `MultiLabelBinarizer`, a 200-tree Random Forest, `cross_val_score(cv=5)`, and writes `symptom_disease_model.pkl`, `symptom_binarizer.pkl`, and `disease_label_encoder.pkl` in the current working directory. The backend's legacy fallback expects those names under the configured model directory. Be explicit about which pipeline you are retraining.

## Lab-report analysis: data and algorithm

`dataset/lab_reference_ranges.csv` is loaded once when `backend/app` imports. Each row has category, canonical test name, gender (`Male`, `Female`, or `Both`), normal minimum/maximum, unit, critical low/high thresholds, and notes.

Upload processing:

1. Validate the extension (`pdf`, `jpg`, `jpeg`, or `png`).
2. Save the file under `backend/uploads/reports/<uuid>.<ext>`.
3. For text PDFs, extract text with PyMuPDF.
4. If PDF text is shorter than 50 characters, render pages at 150 DPI and run RapidOCR; pytesseract is the fallback OCR engine.
5. For images, run RapidOCR first and pytesseract second. OpenCV thresholding is used for the pytesseract path when available.
6. Parse lines containing a test name and numeric value.
7. Resolve common aliases such as `Hb`, `WBC`, `RBC`, `Hct`, `FBS`, `HDL`, `LDL`, `ALT`, `AST`, `BUN`, and `TSH`.
8. If an alias does not match, use fuzzy matching against reference test names when `thefuzz` is installed.
9. Select a gender-specific reference row, then `Both`, then the first matching row.
10. Classify values: outside critical thresholds is `Critical`; outside normal range but not critical is `Borderline`; otherwise `Normal`.
11. Persist the report and each result in the database.

OCR is inherently imperfect. A missing or incorrectly parsed value can produce `Unreadable`, an omitted test, or an incorrect classification. Treat report output as an aid for review, not a clinical decision.

## Database schema

`User` — ID, name, unique email, optional bcrypt password hash, age, gender, optional Google ID, profile-complete flag, created timestamp.

`ChatSession` — user-owned session ID, title, created timestamp.

`ChatMessage` — session ID, sender (`user`/`ai`), message, urgency level, created timestamp.

`Report` — user ID, uploaded file URL, upload timestamp, overall status.

`ReportTestResult` — report ID, canonical test name, numeric value, unit, status.

`MedicineScan` — user ID, image URL, medicine name, uses, side effects, substitutes, scan timestamp. The model exists but no medicine-scan route is currently registered.

The backend calls `db.create_all()` on startup. It also attempts non-destructive user-table changes for nullable password hashes, Google IDs, profile completion, and a partial unique Google index. Existing PostgreSQL databases should additionally receive `backend/migrations/001_google_signin.sql` as described by the backend README.

## Frontend behavior and limitations

- `app/chat/page.tsx` starts with demo conversations and demo threads in React state. It does not currently fetch or persist `ChatSession`/`ChatMessage` records.
- New text messages call `/api/chat/message`; the returned localized text is appended to the visible thread. The older `/api/chat/symptom-check` endpoint remains available for compatibility.
- File attachments call `/api/reports/upload`; the returned report opens in the right-side report panel.
- The frontend API helper translates failed fetches into a “Flask backend on port 5000” message.
- The current voice page automatically displays a sample Amoxicillin transcript/answer after timers. It is not yet a real speech-to-backend clinical conversation.
- The Apple sign-in button in signup UI is presentation-only unless a backend integration is added.
- `dataset/medicine/medicine_dataset.csv` is not currently used to answer medicine questions.

## Bug-fixing guide for AI agents

Before editing:

1. Read this README and identify whether the bug is in browser UI, frontend API transport, Flask route, model loading, OCR/parsing, or database state.
2. Trace the caller in `lib/api.js` and the matching Flask route.
3. Check whether the behavior is real API behavior or demo state.
4. Preserve JWT ownership checks on report reads and protected endpoints.
5. Preserve model artifact/feature-column alignment. Retraining only one artifact is a common source of prediction errors.
6. For OCR changes, test both text PDFs and scanned PDFs/images, including a case with no recognized tests.
7. For medical-response changes, keep uncertainty language, emergency escalation, and the non-diagnosis disclaimer.
8. Do not commit `.env`, uploaded reports, generated SQLite databases, or secrets.

Useful diagnostics:

```bash
npm run lint
npm run build
```

```bash
curl http://localhost:5000/api/health
```

```bash
git status --short
git log --oneline --decorate -15
```

The repository currently has no comprehensive automated test suite. Verification should include lint/build, backend startup, health check, signup/login, a protected request, one symptom request in each supported language, and one PDF/image report upload when changing those areas.

## Development history

The current Git history shows the project grew in these stages:

1. `3910fc4` — initial project.
2. `b6aef91` — UI components, medical datasets, and ignore rules.
3. `86cbb84` — full-stack authentication, chat UI, and PDF/image report analysis backend.
4. `542fcbc` — authentication and protected session management.
5. `2d8d984` — chat/report management and authentication pages.
6. `4b892d7` — core layouts, landing page, and reporting dashboard.
7. `944805c` — voice-mode modal, particle orb, and AI interaction services.
8. `7f297b0` — authentication refinements, symptom predictor service, and multilingual ML integration.
9. `4275d96` — current core chat, voice, authentication components, hooks, and application pages.

When a change conflicts with old behavior, use the current registered routes and callers as the authority, then update this README if the architecture changes.

## License and data provenance

The symptom training script documents the dataset format as the itachi9604 Kaggle disease/symptom description dataset. Confirm the project's permitted use and add an explicit license/provenance notice before public deployment. The repository also contains medical reference content and user-upload directories; review privacy, retention, access control, and applicable healthcare regulations before handling real patient data.
