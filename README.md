# Resumate deployment copy

This independent repository contains the current local frontend and backend.
The original projects and their repositories are preserved.

- `ResuMate-main/`: React/Vite frontend.
- `ai_resume_builder/`: FastAPI backend with OCR and AI extraction.

Make future changes in these folders inside this repository.

## Local development

Frontend: run `npm ci` then `npm run dev` inside `ResuMate-main`.
Backend: create a Python environment, install `ai_resume_builder/requirements.txt`,
install the system PDF conversion dependency (`pdftoppm`), then run
`uvicorn app:app --host 127.0.0.1 --port 8000` inside `ai_resume_builder`.
Configure environment variables privately. No `.env` files are included in this copy.
On this machine, the existing `/games/paddle-env` environment can be reused.

## Deployment layout

Use `ResuMate-main` as the frontend host's root directory and
`ai_resume_builder` as the backend host's root directory.
Set frontend `VITE_API_BASE_URL` to the backend's public HTTPS URL.
Set backend `FRONTEND_ORIGINS` to the frontend's public HTTPS origin.
Supply backend Supabase and AI credentials through the host's environment settings.
Configure the frontend URL in Supabase Auth for login redirects.

Historical handoff notes mention older paths and unfinished work. Use the actual
code in this repository and `ResuMate-main/LOCAL_INTEGRATION.md` for the current flow.

No Git remote is configured until you connect this copy to your new repository.
