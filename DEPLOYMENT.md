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
- `GEMINI_API_KEY`: reads images and PDFs.
- `GEMINI_MODEL`: use a document-capable Gemini model enabled for your account.

Optional summary providers: `GROQ_API_KEY`, `GROQ_MODEL`, `OPENROUTER_API_KEY`,
`OPENROUTER_MODEL`. If they are absent, Gemini generates combined summaries.
Optional `UPLOAD_SIGNING_SECRET` can be a separate strong random private secret;
otherwise the server derives upload signatures using your private Gemini key.
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
