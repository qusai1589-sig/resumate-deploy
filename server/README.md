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
