# Next.js server code

This directory contains the JavaScript backend used by the Next.js route handler
in `app/api/[...path]/route.js`. Start and deploy the whole app from the repository
root, using its `package.json` and root `.env`.

- `api.mjs`: signup/login, authenticated upload tickets, document listing,
  owner checks, private downloads, cached extraction and combined summaries.
- `supabase.mjs`: user-token validation and owner-scoped storage/database calls.
- `ai.mjs`: Gemini image/PDF reading and factual summary providers.
- `resume.mjs`: editable field normalization and multi-document merging.

The frontend uses same-origin `/api` requests. It uploads original files directly
into private Supabase storage, then the server validates owner-scoped signed
metadata, sizes and file signatures before extracting facts. Downloads use
60-second signed URLs created after ownership verification.

Standalone HTTP compatibility helpers remain for regression tests. They are not
started by Next.js or included as a separate Vercel service. Old standalone
package/deployment metadata is retained under `legacy/standalone-node/`.

See [DEPLOYMENT.md](../DEPLOYMENT.md) for the single-project Vercel setup.

ATS analysis: authenticated `POST /api/ats/analyze` accepts multipart fields
`resume` (PDF/DOCX/TXT, max 10 MB, max 10 PDF pages) and `jobDescription`, or JSON
`resumeText` and `jobDescription`. Documents are parsed locally and not stored or
sent to an AI provider. Scanned PDFs are rejected rather than assigned a score.
General readiness weights content evidence 55% and readable structure 45%.
Job-specific analysis weights keyword coverage 35%, recognized skills 25%,
explicit years of experience 10%, content evidence 15%, and structure 15%.
Unavailable metrics are excluded and remaining weights normalized. Experience
matching uses explicitly stated years only, avoiding guessed or double-counted
employment dates. Formatting measures text structure, not columns or visual
layout. Results expose weights and version; they are estimates, not employer
ATS certification. Suggestions require manual review and never edit a resume.

ATS methodology v2 validates resume content before calculating a score, for
both uploads and JSON requests. Validation checks standard section headings,
career evidence, contact information and common non-resume document markers.
Unrecognized documents receive HTTP 422 and no score. This is rule-based
classification: unusual layouts may need standard headings; it cannot prove
that a deliberately fabricated resume is authentic. Content scoring uses
achievement sentences rather than only newline counts, reducing dependence
on PDF line wrapping. The UI rejects outdated responses and labels v2 results.
