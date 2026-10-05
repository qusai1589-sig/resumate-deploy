# Local authentication and document integration

Frontend: `/games/ResuMate-main` (this is the folder's actual capitalization).
Backend: `/games/ai_resume_builder`.

Start the backend in one terminal:

```bash
cd /games/ai_resume_builder
/games/paddle-env/bin/uvicorn app:app --reload --host 127.0.0.1 --port 8000
```

Start the frontend in another terminal:

```bash
cd /games/ResuMate-main
npm ci
npm run build
npm run dev -- --host 127.0.0.1
```

Open `http://127.0.0.1:5173`. The API defaults to `http://127.0.0.1:8000`.
An optional local `VITE_API_BASE_URL` can override the API URL. Do not add
server-side keys to frontend configuration.

The backend uses its existing `SUPABASE_URL` and **public** `SUPABASE_ANON_KEY`.
`GET /auth/config` exposes only those public client settings; storage and database
requests use the signed-in user's access token and existing owner policies.
`FRONTEND_ORIGINS` optionally overrides the comma-separated local CORS origins.

Google sign-in uses Supabase Auth with PKCE. In Supabase, enable the Google
provider and allow the local callback URLs you use:
`http://localhost:5173/` and `http://127.0.0.1:5173/`.
The Google OAuth client must use the callback URL shown by Supabase.
See the [Supabase Google Auth documentation](https://supabase.com/docs/guides/auth/social-login/auth-google).

## Browser verification

1. Create an account; if email confirmation is enabled, confirm it and then sign in.
2. Sign out and sign in with email/password. Reload to check session restoration.
3. Sign out, choose Continue with Google, and complete consent.
4. Open Certificate Vault. Select or drop up to five PDF/PNG/JPG/JPEG/WebP files,
   each at most 10 MB. Processing uses the existing OCR/AI pipeline.
5. View the original document image or PDF, return to the vault, and reload it.
   Select Use in Resume, choose a template, and continue to fill the candidate name
   and relevant resume sections.
   Review and edit the resulting fields. Importing another document preserves the
   current draft during navigation. Choose Save to retain a snapshot in your
   browser, then use the account menu → Your Resumes → Open & Edit to reopen it.
6. Download a document using its download action. Downloads use an authenticated
   API request, rather than a public storage URL.
7. Sign in with a second account: the first account's documents must be absent.
   Requesting the first account's document ID must return 404.

Extraction is retained as a private `.extraction.json` object beside the original
under the same user folder in Storage, without adding database columns. It is
used internally and never rendered in the vault. Older documents without retained
extraction are reprocessed on first Use in Resume. If private JSON caching is
blocked by bucket configuration, the original remains available and extraction
is repeated when needed.

The vault's old sample uploads, fabricated credentials, and local-only deletion
have been removed from the active flow. Stored metadata editing/deletion is not
implemented by the backend. Other resume/ATS features retain their existing mocks.

## Automated verification

```bash
cd /games/ResuMate-main
npm test
cd /games/ai_resume_builder
/games/paddle-env/bin/python -m unittest discover -s tests -v
```

Twenty-six frontend tests and twenty backend tests pass. External Supabase and AI
responses are substituted in the API tests; these do not establish live cloud
correctness. Frontend tests exercise authentication, document requests, and the
mapping of extracted information into editable resume fields. Backend tests cover
private extraction retention/reprocessing, ownership, validation, and PDF scratch
file cleanup. An additional real PaddleOCR smoke test recognized a candidate name
and course from a generated certificate image.

The production build (`npm run build`), lint (`npm run lint`), Python compilation,
and backend diff checks pass. Browser consent and live cloud calls remain
unverified in the Codex sandbox because it prohibits network sockets.

The provided Google error screenshot specifically says the provider is disabled.
Enable Google in Supabase Authentication → Sign In / Providers, enter your Google
OAuth credentials there, and configure the callback/redirect URLs described above.
The local app now checks provider availability before redirecting and shows an
inline message when Google is disabled, instead of navigating to the raw error.

Dashboard initials use the authenticated full name (Google or signup metadata),
then the email prefix when a name is unavailable. New email signups can provide a
full name. The builder again starts with its original template example content so all design
sections remain visible. Extracted facts replace the corresponding example fields
and rows; untouched examples remain editable. Template layouts and styles have
not been redesigned. Uploaded filenames are not inserted as candidate facts.

## Using certificates and the account menu

Achievements has Add Certificates (direct upload and AI import) and Choose from
Vault (import an existing private document). Upload results are retained per owner
in the running frontend, including the exact inserted document ID from the backend.
Use in Resume reuses those results rather than making an unnecessary second
extraction request. Older uploads still use the authenticated extraction endpoint.
An unavailable endpoint is reported as an outdated running backend; a missing
owned document receives a different message. Stop any old backend and restart the
command above from the specified backend folder.

Click your initial to access Your Resumes, Home Page, Dashboard, Certificate Vault,
and Logout. The builder Save button now stores a resume snapshot per account in
this browser. Your Resumes can reopen snapshots for editing. These saved resumes
are local to this browser; they are not synced to Supabase or other devices.

No changes were pushed or committed, and no local environment values were printed.

Use → Template Selection → Continue now applies the chosen document to the chosen
template. Generated summaries fill Summary, and numeric CGPA/GPA, overall grade,
percentage, totals, institutions, and academic years fill Education. A percentage
is calculated only from explicit obtained/maximum totals, with the calculation
labelled. CGPA is not converted to a percentage without a stated formula. Older
private extraction caches are refreshed using the improved mapping. No chatbot
has been implemented.

## Combining certificates

Select 2–5 checkboxes in the vault and choose Generate Combined Summary. Review
the single AI summary, then Choose Template & Use Combined Information. All
selected document facts populate the relevant resume sections, with duplicate
facts removed. All selected documents must belong to the signed-in user and be
for the same candidate. The backend validates ownership before OCR or AI calls.

Uploading several certificates auto-selects the new documents; Combine Uploaded
Certificates opens their combined summary. Uploading several files directly from
Achievements also uses one combined summary rather than overwriting it with the
last individual certificate summary. If AI summarization fails, the app displays
an error and retains the original documents so the operation can be retried.
