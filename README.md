# ResuMate — one Next.js app

The website and its API run together on one domain in one Vercel project.
The existing resume templates, editor and certificate vault are preserved.
This repository is independent of the original frontend and backend repositories.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Start these commands from the repository root.
Keep private configuration in the root `.env`; Next.js loads it automatically.
No separate Python server, Docker container or backend URL is needed.

## Code

- `app/`: Next.js page, layout and `/api` route handler.
- `server/`: server-side authentication, private document operations and AI.
- `src/`: existing React UI and original template designs; UI views are in `src/screens`.
- `tests/`: API tests, including ownership and document extraction flows.
- `ai_resume_builder/`: previous Python implementation retained for reference;
  it is not used by the Next.js app and its dependencies are not deployed.

The repository has one active root package and one Next.js deployment.
Previous Vite and standalone deployment metadata are retained under `legacy/`
as reference files. Start and deploy the app from the repository root.

Document images and PDFs are read directly by Gemini vision on the server.
This replaces native PaddleOCR/PDF conversion dependencies in the deployed app.
Groq, OpenRouter and Gemini can generate the combined factual summary.
Original documents and extraction caches remain private in Supabase Storage.
Uploads up to 10 MB go directly to owner-protected Supabase storage, then the API
validates their signed upload tickets, file signatures, sizes and ownership.
Downloads use authenticated owner checks followed by 60-second signed URLs.

## Checks

```bash
npm test
npm run lint
npm run build
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the settings for the existing Vercel project.
Never commit `.env` or add AI/service-role keys to public frontend variables.
