import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { ApiError, readJson, requireCondition } from './errors.mjs';
import { createSupabase, publicConfig, objectPath, boundedBytes, detectFileType, MAX_FILE_BYTES } from './supabase.mjs';
import { combineResumeData, MAPPING_VERSION, normalizeResumeData, hasFacts } from './resume.mjs';
import { extractDocument, generateSummary } from './ai.mjs';

const json = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const fileTypes = { pdf: 'application/pdf', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp' };

function signingKey(env) {
  const key = env.UPLOAD_SIGNING_SECRET || env.GEMINI_API_KEY || env.GROQ_API_KEY;
  requireCondition(key, 503, 'Configure an AI provider key or UPLOAD_SIGNING_SECRET before uploading documents.');
  return key;
}
function sign(value, env) {
  return createHmac('sha256', signingKey(env)).update(`resumate-upload-v1:${value}`).digest('base64url');
}
function issueTicket(data, env) {
  const encoded = Buffer.from(JSON.stringify(data)).toString('base64url');
  return `${encoded}.${sign(encoded, env)}`;
}
function readTicket(ticket, owner, env) {
  requireCondition(typeof ticket === 'string' && ticket.length < 3000, 400, 'Invalid upload ticket.');
  const parts = ticket.split('.');
  requireCondition(parts.length === 2, 400, 'Invalid upload ticket.');
  const expected = Buffer.from(sign(parts[0], env));
  const actual = Buffer.from(parts[1]);
  requireCondition(actual.length === expected.length && timingSafeEqual(actual, expected), 400, 'Invalid upload ticket.');
  let data;
  try { data = JSON.parse(Buffer.from(parts[0], 'base64url').toString()); }
  catch { throw new ApiError(400, 'Invalid upload ticket.'); }
  requireCondition(data.user_id === owner.id && data.file_path?.startsWith(`${owner.id}/`), 403, 'This upload belongs to another account.');
  requireCondition(data.expires_at > Date.now(), 400, 'Upload expired. Please upload the document again.');
  return data;
}

async function cacheExtraction(path, extraction, owner, supabase) {
  try {
    // Best effort: some buckets exclude JSON MIME types. The original document
    // stays private and can be read again even if caching is not permitted.
    await supabase.request(objectPath(`${path}.extraction.json`), {
      method: 'POST', token: owner.token,
      headers: { 'Content-Type': 'application/json', 'x-upsert': 'true' },
      body: JSON.stringify(extraction),
    });
  } catch { /* Preserve the successful upload when cache storage is unavailable. */ }
}

async function extractRecord(record, owner, supabase, env, fetcher) {
  const cached = await supabase.request(objectPath(`${record.file_path}.extraction.json`, true), { token: owner.token });
  if (cached.ok) {
    try {
      const data = JSON.parse((await boundedBytes(cached, 256 * 1024)).toString());
      if ([2, MAPPING_VERSION].includes(data.mapping_version) && data.resume_data) {
        const facts = normalizeResumeData({ resume_data: { ...data.resume_data, summary: data.resume_data.summary || data.resume_summary } });
        if (hasFacts(facts)) return { ...data, resume_data: facts, resume_summary: facts.summary };
      }
    } catch { /* Regenerate an old or invalid extraction from the original. */ }
  } else {
    requireCondition([400, 404].includes(cached.status), 502, 'Document analysis unavailable.');
  }
  const response = await supabase.request(objectPath(record.file_path, true), { token: owner.token, timeout: 60000 });
  requireCondition(response.ok, 404, 'File not found');
  const bytes = await boundedBytes(response);
  const detected = detectFileType(record.file_name, bytes);
  const extraction = await extractDocument(bytes, detected.mime, env, fetcher);
  await cacheExtraction(record.file_path, extraction, owner, supabase);
  return extraction;
}

async function prepareUpload(data, owner, supabase, env) {
  requireCondition(Array.isArray(data.files) && data.files.length >= 1 && data.files.length <= 5, 400, 'Select between 1 and 5 documents.');
  const files = data.files.map(file => {
    const name = typeof file?.file_name === 'string' ? file.file_name.split(/[\\/]/).pop().trim() : '';
    const extension = name.toLowerCase().split('.').pop();
    requireCondition(name && name.length <= 255 && ![...name].some(character => character.charCodeAt(0) < 32) && fileTypes[extension], 400, 'Only PDF, PNG, JPG, JPEG, and WebP documents are supported.');
    requireCondition(Number.isInteger(file.file_size_bytes) && file.file_size_bytes > 0 && file.file_size_bytes <= MAX_FILE_BYTES, 400, 'Each document must be nonempty and no larger than 10 MB.');
    const file_path = `${owner.id}/${randomUUID().replaceAll('-', '')}.${extension}`;
    const payload = { user_id: owner.id, file_name: name, file_path, file_size_bytes: file.file_size_bytes, mime_type: fileTypes[extension], expires_at: Date.now() + 30 * 60 * 1000 };
    return { ticket: issueTicket(payload, env), mime_type: payload.mime_type, upload_url: `${supabase.config.url}${objectPath(file_path)}` };
  });
  return { files, user_id: owner.id, anon_key: supabase.config.anon_key };
}

async function finalizeUpload(data, owner, supabase, env, fetcher) {
  requireCondition(Array.isArray(data.files) && data.files.length >= 1 && data.files.length <= 5, 400, 'Select between 1 and 5 documents.');
  // Validate every ticket before accessing storage or invoking AI.
  const tickets = data.files.map(file => readTicket(file?.ticket, owner, env));
  requireCondition(new Set(tickets.map(item => item.file_path)).size === tickets.length, 400, 'Select different documents.');
  const results = [];
  for (const ticket of tickets) {
    try {
      const existing = await supabase.documents(owner, { select: '*', user_id: `eq.${owner.id}`, file_path: `eq.${ticket.file_path}`, limit: '1' });
      if (existing[0]) {
        const extraction = await extractRecord(existing[0], owner, supabase, env, fetcher);
        results.push({ success: true, document: existing[0], document_id: existing[0].id, filename: ticket.file_name, storage_path: ticket.file_path, user_id: owner.id, database_saved: true, ...extraction });
        continue;
      }
      const response = await supabase.request(objectPath(ticket.file_path, true), { token: owner.token, timeout: 60000 });
      requireCondition(response.ok, 404, 'Uploaded file could not be found. Please try again.');
      const bytes = await boundedBytes(response);
      requireCondition(bytes.length === ticket.file_size_bytes, 400, 'Uploaded file size does not match. Please upload it again.');
      const detected = detectFileType(ticket.file_name, bytes);
      const extraction = await extractDocument(bytes, detected.mime, env, fetcher);
      const record = { user_id: owner.id, file_name: ticket.file_name, file_path: ticket.file_path, file_size_bytes: bytes.length, mime_type: detected.mime, document_type: extraction.structured_data.document_type, status: 'processed' };
      const saved = await supabase.request('/rest/v1/documents', { method: 'POST', token: owner.token, headers: { 'Content-Type': 'application/json', Prefer: 'return=representation' }, body: JSON.stringify(record) });
      if (!saved.ok) {
        // A rejected insert cannot leave an orphan object. Network errors are
        // handled separately because the insert may already have succeeded.
        try {
          await supabase.request('/storage/v1/object/uploads', { method: 'DELETE', token: owner.token, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prefixes: [ticket.file_path] }) });
        } catch { /* The owner can still remove the object in storage. */ }
        throw new ApiError(502, 'Document could not be saved. Please try again.');
      }
      const rows = await saved.json();
      const document = Array.isArray(rows) ? rows[0] : null;
      requireCondition(document?.id, 502, 'Document was saved but could not be located. Refresh your vault.');
      await cacheExtraction(ticket.file_path, extraction, owner, supabase);
      results.push({ success: true, document, document_id: document.id, filename: ticket.file_name, storage_path: ticket.file_path, user_id: owner.id, database_saved: true, ...extraction });
    } catch (error) {
      results.push({ success: false, filename: ticket.file_name, error: error instanceof ApiError ? error.message : 'Document processing failed. Please try again.' });
    }
  }
  const successful = results.filter(item => item.success).length;
  return { success: successful > 0, results, total_files: results.length, successful_files: successful, failed_files: results.length - successful };
}

async function multipartUpload(request, owner, supabase, env, fetcher) {
  let form;
  try { form = await request.formData(); }
  catch { throw new ApiError(400, 'Invalid multipart upload.'); }
  const files = form.getAll('files');
  requireCondition(files.length >= 1 && files.length <= 5 && files.every(file => typeof file?.arrayBuffer === 'function'), 400, 'Select between 1 and 5 documents.');
  const results = [];
  for (const file of files) {
    const filename = typeof file.name === 'string' ? file.name.split(/[\\/]/).pop() : '';
    try {
      requireCondition(file.size > 0 && file.size <= MAX_FILE_BYTES, 400, 'Each document must be nonempty and no larger than 10 MB.');
      const bytes = Buffer.from(await file.arrayBuffer());
      const detected = detectFileType(filename, bytes);
      const prepared = await prepareUpload({ files: [{ file_name: filename, file_size_bytes: bytes.length }] }, owner, supabase, env);
      const ticket = readTicket(prepared.files[0].ticket, owner, env);
      const stored = await supabase.request(objectPath(ticket.file_path), { method: 'POST', token: owner.token, headers: { 'Content-Type': detected.mime }, body: bytes, timeout: 60000 });
      requireCondition(stored.ok, 502, 'Private storage upload failed. Please try again.');
      const finalized = await finalizeUpload({ files: [{ ticket: prepared.files[0].ticket }] }, owner, supabase, env, fetcher);
      results.push(...finalized.results);
    } catch (error) {
      results.push({ success: false, filename, error: error instanceof ApiError ? error.message : 'Document processing failed. Please try again.' });
    }
  }
  const successful = results.filter(item => item.success).length;
  return { success: successful > 0, results, total_files: results.length, successful_files: successful, failed_files: results.length - successful };
}

async function account(data, signup, supabase, request, signupRedirectUrl) {
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  requireCondition(email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && typeof data.password === 'string' && data.password.length >= (signup ? 8 : 1) && data.password.length <= 1024, 400, 'Enter a valid email and password. Signup passwords need at least 8 characters.');
  requireCondition(!data.full_name || typeof data.full_name === 'string' && data.full_name.length <= 120, 400, 'Name must be at most 120 characters.');
  const path = signup ? '/auth/v1/signup' : '/auth/v1/token?grant_type=password';
  const body = { email, password: data.password, ...(signup ? { data: { full_name: (data.full_name || '').trim() } } : {}) };
  const headers = { 'Content-Type': 'application/json' };
  if (signup) headers['redirect-to'] = signupRedirectUrl || new URL(request.url).origin;
  const response = await supabase.request(path, { method: 'POST', headers, body: JSON.stringify(body) });
  requireCondition(response.ok, signup ? 400 : 401, signup ? 'Signup failed. Check the email and password.' : 'Invalid credentials or unconfirmed email');
  const result = await response.json();
  return { message: signup ? 'Account created. Check your email if confirmation is enabled.' : 'Login successful', user: result.user, user_id: result.user?.id, email: result.user?.email, access_token: result.access_token, refresh_token: result.refresh_token, expires_in: result.expires_in, token_type: 'bearer' };
}

export function createHandler({ env = process.env, fetcher = globalThis.fetch, downloadMode = 'signed', runtimeName = 'Next.js', allowMultipart = false, signupRedirectUrl } = {}) {
  return async function handleRequest(request) {
    try {
      const path = new URL(request.url).pathname.replace(/^\/api(?:\/|$)/, '').replace(/^\//, '').replace(/\/$/, '');
      const method = request.method;
      if (!path && method === 'GET') return json({ message: 'AI Resume Builder API is running!', status: 'online' });
      if (path === 'health' && method === 'GET') return json({ status: 'healthy', runtime: runtimeName });
      if (path === 'auth/config' && method === 'GET') return json(publicConfig(env));
      const supabase = createSupabase(env, fetcher);
      if (['signup', 'login'].includes(path) && method === 'POST') return json(await account(await readJson(request), path === 'signup', supabase, request, signupRedirectUrl));
      const owner = await supabase.user(request);
      if (path === 'documents' && method === 'GET') return json({ documents: await supabase.documents(owner, { select: 'id,user_id,document_type,file_name,file_path,file_size_bytes,mime_type,status,uploaded_at', user_id: `eq.${owner.id}`, order: 'uploaded_at.desc' }) });
      if (path === 'upload/prepare' && method === 'POST') return json(await prepareUpload(await readJson(request), owner, supabase, env));
      if (path === 'upload' && method === 'POST') {
        if (allowMultipart && request.headers.get('content-type')?.startsWith('multipart/form-data')) return json(await multipartUpload(request, owner, supabase, env, fetcher));
        return json(await finalizeUpload(await readJson(request), owner, supabase, env, fetcher));
      }
      if (path === 'documents/combine' && method === 'POST') {
        const { document_ids: ids } = await readJson(request);
        requireCondition(Array.isArray(ids) && ids.length >= 2 && ids.length <= 5 && new Set(ids).size === ids.length, 400, 'Select between 2 and 5 different documents.');
        // Verify every owner first, before starting any document AI work.
        const records = [];
        for (const id of ids) records.push(await supabase.ownedDocument(id, owner));
        const extractions = [];
        for (const record of records) extractions.push(await extractRecord(record, owner, supabase, env, fetcher));
        const resume_data = combineResumeData(extractions.map(item => item.resume_data));
        const summary = await generateSummary(resume_data, env, fetcher);
        requireCondition(summary, 503, 'Combined AI summary is unavailable. Please try again.');
        resume_data.summary = summary;
        return json({ id: `combined:${[...ids].sort().join(',')}`, source_document_ids: ids, resume_data, resume_summary: summary, mapping_version: MAPPING_VERSION });
      }
      const match = /^documents\/([^/]+)\/(file|extraction)$/.exec(path);
      if (match && (match[2] === 'file' && method === 'GET' || match[2] === 'extraction' && method === 'POST')) {
        const record = await supabase.ownedDocument(match[1], owner);
        if (match[2] === 'extraction') return json(await extractRecord(record, owner, supabase, env, fetcher));
        if (downloadMode === 'binary') {
          const original = await supabase.request(objectPath(record.file_path, true), { token: owner.token, timeout: 60000 });
          requireCondition(original.ok, 404, 'File not found');
          return new Response(original.body, { headers: {
            'Content-Type': record.mime_type || 'application/octet-stream',
            'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(record.file_name)}`,
            'Cache-Control': 'private, no-store',
            'X-Content-Type-Options': 'nosniff',
          } });
        }
        const response = await supabase.request(`/storage/v1/object/sign/uploads/${record.file_path.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', token: owner.token, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 60 }) });
        requireCondition(response.ok, 404, 'File not found');
        const signed = await response.json();
        const path = signed.signedURL || signed.signedUrl;
        requireCondition(typeof path === 'string', 502, 'Download unavailable.');
        const url = new URL(path.startsWith('/object/') ? `/storage/v1${path}` : path, supabase.config.url);
        requireCondition(url.origin === new URL(supabase.config.url).origin && url.pathname.startsWith('/storage/v1/object/sign/uploads/'), 502, 'Download unavailable.');
        return json({ url: url.href, mime_type: record.mime_type });
      }
      return json({ detail: 'Not Found' }, 404);
    } catch (error) {
      // Provider responses and exceptions can contain secrets or document text.
      // Return only errors intentionally written for the user; log no raw data.
      return json({ detail: error instanceof ApiError ? error.message : 'Request failed. Please try again.' }, error instanceof ApiError ? error.status : 500);
    }
  };
}

export const handleRequest = createHandler();
