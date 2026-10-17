# Deploy the complete Next.js app on Vercel

Use the existing `qusai1589-sig/resumate-deploy` repository and Vercel project.
One deployment serves the existing website and all `/api` endpoints.
The UI lives in `src/`, Next.js routes in `app/`, and private server code in `server/`.
The application has one active root `package.json`.

## Local verification before publishing

Run from the repository root:

```bash
npm install
npm test
npm run lint
npm run build
npm start
```

Visit http://localhost:3000/api/health, then test the app at http://localhost:3000.
The root `.env` stays local and is automatically loaded by Next.js.

## Change existing Vercel project settings

- Root Directory: repository root (`./`), replacing `ResuMate-main`.
- Framework Preset: Next.js, replacing Vite or Services.
- Install Command: `npm install`.
- Build Command: `npm run build`.
- Output Directory: clear the old `dist` override; use the Next.js default.
- Use a supported Node.js version, at least 22.

The root `vercel.json` also declares the Next.js framework and build command.
Do not import the frontend or Python backend as a separate service.
Remove `VITE_API_BASE_URL`; all frontend requests now use `/api` on the same origin.
`FRONTEND_ORIGINS` is unnecessary for this deployment because there is no cross-origin API.

## Private Vercel environment settings

Import the variables from the local root `.env` in Vercel's Environment Variables
settings for Production (and Preview if you want preview deployments to work).
These values remain server-side; do not prefix them with `NEXT_PUBLIC_`.

Required:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`: the public anon/publishable key, not a service-role key.
- At least one of `GEMINI_API_KEY` or `GROQ_API_KEY`: reads images and PDFs.
- `GEMINI_MODEL`: use a document-capable Gemini model enabled for your account when using Gemini.
- `GROQ_VISION_MODEL`: optional vision model override; defaults to `qwen/qwen3.8-27b`.
  This is separate from the text summary setting `GROQ_MODEL`.

Optional summary providers: `GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`,
`OPENROUTER_MODEL`. If they are absent, Gemini generates combined summaries.
Optional `UPLOAD_SIGNING_SECRET` can be a separate strong random private secret;
otherwise the server derives upload signatures using your private Gemini or Groq key.
No Supabase service-role key is required by the new API.

Deploy after saving the settings. Adding variables does not change an existing
deployment until it is redeployed.

## Supabase authentication

Set production Site URL and add redirect URL:
`https://resumate-deploy.vercel.app`.
For local Google testing, also allow `http://localhost:3000`.
Google sign-in requires the Google provider to be enabled in Supabase.
Keep the existing owner RLS policies and the private `uploads` storage bucket.

## Verify the deployed app

1. Open https://resumate-deploy.vercel.app/api/health.
2. Test signup, email confirmation, login and Google login.
3. Upload a PNG certificate and a PDF mark sheet, including a file over 4.5 MB.
4. Confirm previews show the originals and private downloads work.
5. Select two or three documents, generate the combined summary, choose a
   template and verify name, grades, education and achievements remain editable.
6. Sign out and confirm document endpoints reject missing tokens.

Supabase Storage receives file bytes directly from the authenticated browser,
avoiding Vercel's function request/response payload limits. The Next.js API
verifies the authenticated user, signed metadata and actual stored file before
reading it with Gemini. Provider keys and document bytes never enter static assets.

## Extraction fallback

Gemini is tried first. On provider errors, invalid JSON or unreadable results,
Groq vision receives the private image bytes if `GROQ_API_KEY` is configured.
PDFs are rendered on the server and sent in batches of at most three page images;
all batches are merged into editable resume facts. The fallback accepts up to
12 pages per PDF; longer PDFs receive a clear request to split the document.
No PaddleOCR models or separate Python server are used.

After updating, run `npm install` to install the PDF renderer and update the lockfile
before building and publishing the new commit. Add `GROQ_API_KEY` to Vercel
Production variables and redeploy. Provider keys remain private.

## Account-linked assistant history

The assistant uses the existing Supabase login (including Google sign-in) and
private `uploads` bucket. Each turn lives at `<auth-user-id>/chat/<turn-id>.json`.
No Gmail inbox access or extra Google scopes are needed, and no database
migration is required. Users must sign in to the same account on each device.
Storage policies must allow authenticated owners to SELECT, INSERT and UPDATE
objects inside their own user-ID folder, including nested `chat/` objects.
Never make the bucket public. The API derives paths from the verified token;
client-supplied email addresses or account IDs never select the conversation.

Set server-only `GROQ_API_KEY`; optionally set `GROQ_CHAT_MODEL` (default
`openai/gpt-oss-20b`). Deploy this app to enable `/api/chat` GET and POST.
Questions save before AI generation. Completed replies save before returning to
the browser. Interrupted questions have a Retry reply action. A per-account local
outbox retains an unacknowledged question on the original browser. Questions that
never reached storage become available across devices only after a successful
retry. Reply generation uses the last ten completed turns as context. History is
loaded in pages of 50 turns; Load older messages retrieves earlier pages. Refresh
saved conversation picks up messages from another device; updates are not live.

After deployment, test Google login, send a message, reload, sign in on a second
device with the same account, and confirm history. Sign in as another user and
confirm that account cannot see the first user's conversation. Disable the AI
provider temporarily to verify saved questions can be retried. Local automated
tests mock Supabase and Groq; live storage policy verification remains required.

### Assistant customization

`GET/POST /api/chat/profile` reads and saves a private assistant name and picture
at `<auth-user-id>/chat-profile.json`. Names accept 1–40 characters. Pictures
accept PNG/JPEG/WebP input, are cropped and resized in the browser, and are
validated again on the server (48,000-character data URL limit). SVG and external
image URLs are rejected. Both settings follow the signed-in account across devices.
The server uses the saved name when generating replies.

### Google login diagnostic (17 October 2026)

The configured project hostname `choysxyeayaeenfrntqf.supabase.co` returns DNS
NXDOMAIN. The live website's `/api/auth/config` also points to that hostname.
Authentication and storage cannot work until that project is restored or the
correct project URL and corresponding anon key are supplied. Check the Supabase
dashboard for the project's status. After restoring the project, enable Google
under Authentication > Providers, configure the Google OAuth client with the
Supabase callback URL, and allow the website's exact URL in Auth redirect settings.
The existing local `GROQ_API_KEY` was verified with a successful live request;
`GROQ_CHAT_MODEL=openai/gpt-oss-20b` is configured locally. Vercel environment
variables must be set separately before deployment. No deployment credential is
available in this workspace, so production has not been updated.

### Fix denied chat storage access

If the assistant reports denied storage access, run
`supabase/migrations/20261017_private_chat_storage.sql` in the project's SQL Editor.
It adds authenticated owner-only SELECT, INSERT and UPDATE policies for chat and
profile JSON, and adds application/json to an existing bucket MIME allowlist.
It preserves existing document policies and refuses to run against a public or
missing uploads bucket. Refresh the website and retry the pending reply afterward.
The public anon key cannot apply policies; this requires the project owner's
SQL Editor. Existing restrictive policies may still deny requests and must be
reviewed in Supabase if this migration does not resolve the error.
