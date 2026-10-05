# AI Resume Builder — Project Handoff

## Purpose
This is the handoff for continuing the AI Resume Builder college project in another ChatGPT/Codex account. Read this before modifying the project.

## Primary project
- Backend: `/games/ai_resume_builder`
- Frontend: `/games/ResumeBuilder`
- Primary GitHub repository: `https://github.com/qusai1589-sig/AI-Resume-builder.git`
- Branch: `main`
- The `*_drive_test` folders are experimental copies and are NOT the primary project.

## Project goal
AI-powered resume/document system that:
1. Accepts certificates, marksheets, internships, letters, projects, etc.
2. Extracts text using OCR.
3. Uses AI to convert OCR text into structured information.
4. Generates resume/profile information such as summaries.
5. Stores documents and metadata.
6. Eventually provides a React frontend for login, document vault, resume creation, and related workflows.

## Backend stack
- FastAPI
- PaddleOCR
- OpenCV preprocessing where applicable
- `pdftoppm` for PDF-to-image conversion
- Gemini as primary AI provider
- Groq fallback
- OpenRouter fallback
- Supabase Auth
- Supabase Storage
- Supabase database

## Frontend stack
- React
- Vite
- React 19
- `lucide-react`

## Python environment
Virtual environment:
`/games/paddle-env`

Fish activation:
```fish
cd /games/ai_resume_builder
source ../paddle-env/bin/activate.fish
```

## Run backend
```fish
cd /games/ai_resume_builder
source ../paddle-env/bin/activate.fish
uvicorn app:app --host 0.0.0.0 --port 8000
```

Local API/docs:
- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/docs`

## Environment
Backend `.env` contains secrets and must never be committed.

Expected variables:
```env
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.6-flash

GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-120b

OPENROUTER_API_KEY=
OPENROUTER_MODEL=nvidia/nemotron-3-super-120b-a12b:free

SUPABASE_URL=
SUPABASE_KEY=
```

`.env.example` is committed; `.env` is ignored.

## Supabase
`supabase_client.py` creates server-side clients from environment variables.

Storage bucket:
`uploads`

Database table:
`documents`

Known fields:
- `id`
- `user_id`
- `document_type`
- `file_name`
- `file_path`
- `file_size_bytes`
- `mime_type`
- `status`
- `uploaded_at`
- `processed_at`

A broad insert policy was previously created:
```sql
create policy "Allow document inserts"
on "public"."documents"
as PERMISSIVE
for INSERT
to public
with check (true);
```
This must be reviewed/restricted during security hardening.

## Important login debugging discovery
The backend login previously appeared to fail with:
```json
{"detail":"[Errno -2] Name or service not known"}
```
The actual root cause was that the Supabase project had been paused/shut down because it had not been used for a long time. Supabase was restarted, and the Supabase client initialized successfully.

A previous 422 was caused by malformed JSON (missing closing quote in the email value), not by the login implementation.

Login endpoint:
`POST /login`

Use Swagger first:
`http://127.0.0.1:8000/docs`

Expected body:
```json
{
  "email": "user@example.com",
  "password": "YOUR_PASSWORD"
}
```

Never put real passwords or API keys in this handoff.

## Backend testing order
Before connecting the frontend:
1. Python/import checks
2. `.env` presence checks without printing secrets
3. Supabase client initialization
4. FastAPI startup
5. `GET /`
6. Swagger
7. `POST /login`
8. Upload with one test file
9. Multiple-file upload
10. OCR
11. AI extraction
12. AI summary
13. Supabase Storage
14. Database insert
15. Error handling/cleanup
16. Security hardening

## Upload/OCR/AI pipeline
```text
Client file
   ↓
FastAPI upload
   ↓
Validate file
   ↓
Temporary file
   ↓
OCR
   ↓
Structured AI extraction
   ↓
AI summary where needed
   ↓
Supabase Storage
   ↓
documents database insert
   ↓
response
```

PDF processing has used:
```bash
pdftoppm -png -r 200
```

The upload endpoint previously supported multiple files and successfully processed two test files (`test.pdf` and `153.png`).

AI extraction is intended to be document-agnostic, return valid JSON, and not invent information unsupported by the source.

Fallback order:
1. Gemini
2. Groq
3. OpenRouter

## Frontend
Primary frontend:
`/games/ResumeBuilder`

Relevant areas:
- `src/App.jsx`
- `src/pages/Login.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/ResumeBuilder.jsx`
- `src/pages/TemplateSelection.jsx`
- `src/components/CertificateVault/CertificateVaultModal.jsx`
- `src/services/apiClient.js`
- `src/services/aiService.js`
- `src/services/resumeService.js`

Much of the current frontend is still mock/simulated and needs connection to the real FastAPI backend.

## Google Drive experiment
Google Drive Picker was successfully configured in:
- `/games/ResumeBuilder_drive_test`
- `/games/ai_resume_builder_drive_test`

Configuration used:
- Google Cloud project: `AI Resume Builder - DriveTest`
- Project ID: `ai-resume-builder-drivetest`
- Project/App number: `897243139476`
- Google Picker API enabled
- Google Drive API enabled
- OAuth Web client
- Local JavaScript origin: `http://localhost:5173`
- API key restricted to that origin and Picker/Drive APIs
- OAuth scope: `https://www.googleapis.com/auth/drive.file`
- Testing account added as OAuth test user

The Picker itself works in the experimental copy.

Important: the experimental integration originally passed only the selected Drive filename into the simulated upload/OCR animation. It had NOT yet been completed as a real Drive-file-download → FastAPI upload pipeline.

Do not assume Google Drive is complete in the primary project.

## Security work still required
### Authentication
- Verify Supabase access tokens server-side.
- Create reusable FastAPI authentication dependency.
- Reject missing/invalid/expired tokens.

### Authorization
- Users must only access their own documents.
- Never trust a client-supplied user ID.
- Review and tighten Supabase RLS.

### Upload security
- Allowed file types
- MIME/signature validation where practical
- Maximum file size
- Maximum files/request
- Filename sanitization
- No user-controlled filesystem paths
- Temporary-file cleanup

### API security
- Restrict CORS to actual frontend origins
- Avoid leaking stack traces/secrets
- Consistent exception handling
- Consider rate limiting for login and expensive OCR/AI endpoints
- Validate request bodies

### Secrets
- Keep `.env` local
- Never expose server-side Supabase/AI keys to React

### Integrity/provenance
- SHA-256 for exact duplicate/integrity detection if useful
- Perceptual hashes for visually similar images if useful

## Frontend → backend plan
Do not connect everything at once.

1. Create real frontend API client with configurable backend URL.
2. Connect Login UI to `POST /login`.
3. Establish authentication state/token handling.
4. Add Authorization headers.
5. Connect document upload to `/upload`.
6. Display real OCR/AI processing status/results.
7. Connect Certificate Vault to real backend documents.
8. Connect Resume Builder to extracted data.
9. Add real Google Drive file transfer after local upload works.
10. End-to-end test.

The frontend must never contain backend secrets.

## Immediate next steps
### Phase A — backend verification
```fish
cd /games/ai_resume_builder
source ../paddle-env/bin/activate.fish
python --version
python -c "import fastapi, uvicorn; print('FastAPI:', fastapi.__version__); print('Uvicorn:', uvicorn.__version__)"
python -c "from dotenv import load_dotenv; import os; load_dotenv(); keys=['SUPABASE_URL','SUPABASE_KEY','GEMINI_API_KEY','GROQ_API_KEY','OPENROUTER_API_KEY']; print({k: bool(os.getenv(k)) for k in keys})"
python -c "from supabase_client import supabase; print('Supabase client initialized successfully')"
uvicorn app:app --host 0.0.0.0 --port 8000
```

Second terminal:
```fish
curl http://127.0.0.1:8000/
```

Then use Swagger:
`http://127.0.0.1:8000/docs`

Test login, then upload/OCR/AI.

### Phase B — security
After login/upload/OCR/AI work:
- authentication dependencies
- ownership checks
- CORS restrictions
- file validation/size limits
- safe errors
- RLS tightening

### Phase C — frontend
Only after backend stability, connect React to FastAPI one endpoint at a time.

## Working style
- Work step-by-step.
- Give small, clear instructions.
- Prefer exact copy/paste commands.
- Explain important changes before making them.
- Preserve working behavior.
- Test after each meaningful change.
- Never expose secrets.
- Do not rebuild the project from scratch.

## Critical instruction for Codex
Read this file before changing anything. Inspect the actual repository and current code first. Do not overwrite working files merely to match assumptions. Make incremental changes, run tests/builds after changes, and keep the project runnable at every step.
