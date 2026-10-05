import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/api.mjs';
import { combineResumeData, normalizeResumeData, MAPPING_VERSION } from '../server/resume.mjs';

const owner = '11111111-1111-4111-8111-111111111111';
const foreign = '22222222-2222-4222-8222-222222222222';
const documentId = '33333333-3333-4333-8333-333333333333';
const secondId = '44444444-4444-4444-8444-444444444444';
const env = { SUPABASE_URL: 'https://supabase.example', SUPABASE_ANON_KEY: 'public-test-anon', GEMINI_API_KEY: 'test-private-gemini', GEMINI_MODEL: 'test-model', GROQ_API_KEY: 'test-private-groq' };
const png = Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), Buffer.from('test-readable-image')]);
const json = (data, status = 200) => Response.json(data, { status });
const profile = { personal: { name: 'Qusai Khanorwala', title: 'Computer Engineering' }, education: [{ degree: 'Computer Engineering', institution: 'Example College', year: '2026', details: 'CGPA: 9.3' }], achievements: ['Completed Python Basics — Example Institute'], skills: ['Python'], summary: 'Computer Engineering student with a CGPA of 9.3 and a Python certificate.' };

function fixture({ documents = [], objects = new Map(), extracted = profile, insertFails = false, invalidAi = false, summaryFails = false, handlerOptions = {} } = {}) {
  const calls = [];
  const fetcher = async (address, options = {}) => {
    const url = new URL(address);
    calls.push({ url, options });
    const body = typeof options.body === 'string' ? JSON.parse(options.body) : null;
    if (url.hostname === 'generativelanguage.googleapis.com') {
      assert.equal(options.headers['x-goog-api-key'], env.GEMINI_API_KEY);
      if (invalidAi) return json({ candidates: [{ content: { parts: [{ text: 'not JSON' }] } }] });
      if (summaryFails && !body.contents[0].parts.some(part => part.inlineData)) return json({}, 429);
      return json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ document_type: 'Certificate', resume_data: extracted }) }] } }] });
    }
    if (url.hostname === 'api.groq.com') return summaryFails ? json({}, 429) : json({ choices: [{ message: { content: 'Combined engineering education and Python certification.' } }] });
    assert.equal(url.origin, env.SUPABASE_URL);
    assert.equal(options.headers.apikey, env.SUPABASE_ANON_KEY);
    if (url.pathname === '/auth/v1/user') {
      const token = options.headers.Authorization;
      if (token === 'Bearer owner-token') return json({ id: owner, email: 'owner@example.invalid' });
      if (token === 'Bearer foreign-token') return json({ id: foreign });
      return json({ error: 'invalid' }, 401);
    }
    if (url.pathname === '/auth/v1/signup') return json({ user: { id: owner }, access_token: null });
    if (url.pathname === '/auth/v1/token') return json({ user: { id: owner, email: 'owner@example.invalid' }, access_token: 'owner-token', refresh_token: 'test-refresh', expires_in: 3600 });
    if (url.pathname === '/rest/v1/documents') {
      if (options.method === 'POST') {
        if (insertFails) return json({}, 403);
        const row = { ...body, id: documentId, uploaded_at: '2026-10-05T00:00:00Z' };
        documents.push(row);
        return json([row], 201);
      }
      const filtered = documents.filter(row => (!url.searchParams.get('user_id') || url.searchParams.get('user_id') === `eq.${row.user_id}`) && (!url.searchParams.get('id') || url.searchParams.get('id') === `eq.${row.id}`) && (!url.searchParams.get('file_path') || url.searchParams.get('file_path') === `eq.${row.file_path}`));
      return json(filtered);
    }
    if (url.pathname.startsWith('/storage/v1/object/sign/uploads/')) {
      assert.equal(body.expiresIn, 60);
      return json({ signedURL: `/object/sign/uploads/${url.pathname.split('/uploads/')[1]}?token=test-short-lived` });
    }
    if (url.pathname === '/storage/v1/object/uploads' && options.method === 'DELETE') {
      for (const path of body.prefixes) objects.delete(path);
      return json({});
    }
    if (url.pathname.startsWith('/storage/v1/object/')) {
      const path = decodeURIComponent(url.pathname.split('/uploads/')[1]);
      if (options.method === 'POST') { objects.set(path, Buffer.from(options.body)); return json({}, 201); }
      return objects.has(path) ? new Response(objects.get(path)) : json({}, 404);
    }
    throw new Error(`Unexpected test URL: ${url.pathname}`);
  };
  const handler = createHandler({ env, fetcher, ...handlerOptions });
  async function request(path, { method = 'GET', body, token = 'owner-token' } = {}) {
    const multipart = body instanceof FormData;
    return handler(new Request(`https://resumate.example/api/${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body && !multipart ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: multipart ? body : JSON.stringify(body) } : {}) }));
  }
  async function upload() {
    const prepared = await (await request('upload/prepare', { method: 'POST', body: { files: [{ file_name: 'certificate.png', file_size_bytes: png.length }] } })).json();
    const entry = prepared.files[0];
    const path = new URL(entry.upload_url).pathname.split('/uploads/')[1];
    objects.set(path, png);
    return { prepared, entry, path };
  }
  return { request, handler, upload, calls, objects, documents };
}

test('Next API returns health and only public Supabase config', async () => {
  const app = fixture();
  assert.equal((await app.request('health', { token: null })).status, 200);
  const response = await app.request('auth/config', { token: null });
  assert.deepEqual(await response.json(), { url: env.SUPABASE_URL, anon_key: env.SUPABASE_ANON_KEY });
  assert.match(response.headers.get('cache-control'), /no-store/);
  assert.equal(app.calls.length, 0);
});

test('missing environment gives a useful error; service-role keys cannot leak', async () => {
  for (const configuration of [{}, { ...env, SUPABASE_ANON_KEY: 'sb_secret_test' }, { ...env, SUPABASE_ANON_KEY: `header.${Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')}.signature` }]) {
    const response = await createHandler({ env: configuration })(new Request('https://test/api/auth/config'));
    assert.equal(response.status, 503);
    assert.equal((await response.text()).includes('sb_secret_test'), false);
  }
});

test('protected routes reject missing and invalid tokens before storage or AI', async () => {
  for (const token of [null, 'bad-token']) {
    const app = fixture();
    const response = await app.request('documents', { token });
    assert.equal(response.status, 401);
    assert.equal(app.calls.some(call => call.url.pathname.includes('/rest/')), false);
    assert.equal(app.calls.some(call => call.url.hostname.includes('google')), false);
  }
});

test('signup retains full name and login returns refreshable session', async () => {
  const app = fixture();
  const signup = await app.request('signup', { method: 'POST', token: null, body: { email: 'owner@example.invalid', password: 'test-password', full_name: 'Qusai' } });
  assert.equal(signup.status, 200);
  assert.equal((await signup.json()).access_token, null);
  assert.equal(JSON.parse(app.calls[0].options.body).data.full_name, 'Qusai');
  const login = await app.request('login', { method: 'POST', token: null, body: { email: 'owner@example.invalid', password: 'test-password' } });
  assert.equal((await login.json()).refresh_token, 'test-refresh');
});

test('list filters to the verified owner even if the URL supplies another user ID', async () => {
  const app = fixture({ documents: [{ id: documentId, user_id: owner }, { id: secondId, user_id: foreign }] });
  const response = await app.request(`documents?user_id=${foreign}`);
  assert.deepEqual((await response.json()).documents.map(row => row.id), [documentId]);
  assert.equal(app.calls[1].url.searchParams.get('user_id'), `eq.${owner}`);
});

test('download checks ownership and uses a short-lived signed URL without proxying binary payloads', async () => {
  const app = fixture({ documents: [{ id: documentId, user_id: owner, file_path: `${owner}/original.png`, file_name: 'original.png', mime_type: 'image/png' }] });
  const valid = await app.request(`documents/${documentId}/file`);
  assert.equal(valid.status, 200);
  assert.match((await valid.json()).url, /\/storage\/v1\/object\/sign\/uploads\//);
  const previous = app.calls.length;
  const denied = await app.request(`documents/${documentId}/file`, { token: 'foreign-token' });
  assert.equal(denied.status, 404);
  assert.equal(app.calls.slice(previous).some(call => call.url.pathname.includes('/object/sign/')), false);
});

test('owner-prefix path violation is rejected even if document metadata claims ownership', async () => {
  const app = fixture({ documents: [{ id: documentId, user_id: owner, file_path: `${foreign}/scan.png` }] });
  assert.equal((await app.request(`documents/${documentId}/file`)).status, 404);
});

test('prepare validates file count, size and type before issuing private upload tickets', async () => {
  const app = fixture();
  for (const files of [[], Array.from({ length: 6 }, () => ({})), [{ file_name: 'test.exe', file_size_bytes: 100 }], [{ file_name: 'test.png', file_size_bytes: 11 * 1024 * 1024 }], [{ file_name: 'test.png', file_size_bytes: 0 }]]) {
    assert.equal((await app.request('upload/prepare', { method: 'POST', body: { files } })).status, 400);
  }
  const { prepared, entry } = await app.upload();
  assert.equal(prepared.user_id, owner);
  assert.equal(prepared.anon_key, env.SUPABASE_ANON_KEY);
  assert.ok(entry.upload_url.includes(`/uploads/${owner}/`));
  assert.equal(JSON.stringify(prepared).includes(env.GEMINI_API_KEY), false);
});

test('finalize rejects forged and foreign-account upload tickets before reading storage', async () => {
  const app = fixture();
  const { entry } = await app.upload();
  for (const [ticket, token, status] of [[`${entry.ticket}changed`, 'owner-token', 400], [entry.ticket, 'foreign-token', 403]]) {
    const previous = app.calls.length;
    const response = await app.request('upload', { method: 'POST', token, body: { files: [{ ticket }] } });
    assert.equal(response.status, status);
    assert.equal(app.calls.slice(previous).some(call => call.url.pathname.includes('/storage/') || call.url.hostname.includes('google')), false);
  }
});

test('expired tickets cannot be finalized', async () => {
  const app = fixture();
  const { entry } = await app.upload();
  const originalNow = Date.now;
  Date.now = () => originalNow() + 31 * 60 * 1000;
  try { assert.equal((await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } })).status, 400); }
  finally { Date.now = originalNow; }
});

test('upload uses document bytes in Gemini vision, saves owner metadata and retains editable facts', async () => {
  const app = fixture();
  const { entry, path } = await app.upload();
  const response = await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } });
  assert.equal(response.status, 200);
  const result = (await response.json()).results[0];
  assert.equal(result.success, true);
  assert.equal(result.document_id, documentId);
  assert.equal(result.resume_data.personal.name, profile.personal.name);
  assert.match(result.resume_data.education[0].details, /9.3/);
  const ai = app.calls.find(call => call.url.hostname.includes('google'));
  const parts = JSON.parse(ai.options.body).contents[0].parts;
  assert.equal(parts[1].inlineData.mimeType, 'image/png');
  assert.equal(parts[1].inlineData.data, png.toString('base64'));
  assert.ok(app.objects.has(`${path}.extraction.json`));
  assert.equal(app.documents[0].user_id, owner);
});

test('file signatures and size are validated after private direct upload', async () => {
  const app = fixture();
  const { entry, path } = await app.upload();
  app.objects.set(path, Buffer.alloc(png.length, 32));
  const response = await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } });
  assert.equal((await response.json()).results[0].success, false);
  assert.equal(app.calls.some(call => call.url.hostname.includes('google')), false);
  assert.equal(app.documents.length, 0);
});

test('PDF document bytes are sent directly to document AI without native PDF tools', async () => {
  const app = fixture();
  const pdf = Buffer.from('%PDF-1.7 test');
  const response = await app.request('upload/prepare', { method: 'POST', body: { files: [{ file_name: 'marks.pdf', file_size_bytes: pdf.length }] } });
  const entry = (await response.json()).files[0];
  app.objects.set(new URL(entry.upload_url).pathname.split('/uploads/')[1], pdf);
  const finalized = await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } });
  assert.equal((await finalized.json()).successful_files, 1);
  const ai = app.calls.find(call => call.url.hostname.includes('google'));
  assert.equal(JSON.parse(ai.options.body).contents[0].parts[1].inlineData.mimeType, 'application/pdf');
});

test('failed database insert removes the orphaned original object', async () => {
  const app = fixture({ insertFails: true });
  const { entry, path } = await app.upload();
  const response = await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } });
  assert.equal((await response.json()).failed_files, 1);
  assert.equal(app.objects.has(path), false);
});

test('finalizing the same valid ticket again reuses the document and cached facts', async () => {
  const app = fixture();
  const { entry } = await app.upload();
  for (let index = 0; index < 2; index++) {
    const response = await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } });
    assert.equal((await response.json()).successful_files, 1);
  }
  assert.equal(app.documents.length, 1);
  assert.equal(app.calls.filter(call => call.url.hostname.includes('google')).length, 1);
});

test('existing private extraction can be reused after migrating from Python', async () => {
  const path = `${owner}/old.png`;
  const objects = new Map([[`${path}.extraction.json`, Buffer.from(JSON.stringify({ mapping_version: 2, resume_data: { ...profile, summary: '' }, resume_summary: profile.summary }))]]);
  const app = fixture({ documents: [{ id: documentId, user_id: owner, file_name: 'old.png', file_path: path }], objects });
  const response = await app.request(`documents/${documentId}/extraction`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).resume_data.summary, profile.summary);
  assert.equal(app.calls.some(call => call.url.hostname.includes('google')), false);
});

test('uncached older document is analyzed from the original private image', async () => {
  const path = `${owner}/old.png`;
  const app = fixture({ documents: [{ id: documentId, user_id: owner, file_name: 'old.png', file_path: path }], objects: new Map([[path, png]]) });
  const response = await app.request(`documents/${documentId}/extraction`, { method: 'POST' });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).mapping_version, MAPPING_VERSION);
});

test('invalid AI output is reported without saving invented resume facts or exposing keys', async () => {
  const app = fixture({ invalidAi: true });
  const { entry } = await app.upload();
  const response = await app.request('upload', { method: 'POST', body: { files: [{ ticket: entry.ticket }] } });
  const output = await response.text();
  assert.match(output, /invalid result/);
  assert.equal(output.includes(env.GEMINI_API_KEY), false);
  assert.equal(app.documents.length, 0);
});

test('combining verifies all documents before invoking AI, including a foreign document', async () => {
  const app = fixture({ documents: [{ id: documentId, user_id: owner, file_path: `${owner}/one.png` }, { id: secondId, user_id: foreign, file_path: `${foreign}/two.png` }] });
  const response = await app.request('documents/combine', { method: 'POST', body: { document_ids: [documentId, secondId] } });
  assert.equal(response.status, 404);
  assert.equal(app.calls.some(call => call.url.pathname.includes('/storage/') || call.url.hostname.includes('google')), false);
});

test('combined summary receives facts from both certificates and preserves numeric academic details', async () => {
  const profiles = [profile, { personal: { name: profile.personal.name }, achievements: ['Java Workshop — Second Institute'], skills: ['Java'] }];
  const documents = [documentId, secondId].map((id, index) => ({ id, user_id: owner, file_path: `${owner}/${index}.png`, file_name: `${index}.png` }));
  const objects = new Map(documents.map((row, index) => [`${row.file_path}.extraction.json`, Buffer.from(JSON.stringify({ mapping_version: MAPPING_VERSION, resume_data: profiles[index] }))]));
  const app = fixture({ documents, objects });
  const response = await app.request('documents/combine', { method: 'POST', body: { document_ids: [documentId, secondId] } });
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.deepEqual(result.resume_data.skills, ['Python', 'Java']);
  assert.equal(result.resume_data.achievements.length, 2);
  assert.equal(result.resume_data.education[0].details, 'CGPA: 9.3');
  assert.equal(result.resume_summary, 'Combined engineering education and Python certification.');
  const call = app.calls.find(call => call.url.hostname === 'api.groq.com');
  assert.match(call.options.body, /Java Workshop/);
  assert.match(call.options.body, /Python Basics/);
});

test('combining rejects duplicate IDs and mismatched candidate names', async () => {
  const app = fixture();
  assert.equal((await app.request('documents/combine', { method: 'POST', body: { document_ids: [documentId, documentId] } })).status, 400);
  assert.throws(() => combineResumeData([profile, { personal: { name: 'Other Person' } }]), /different candidate names/);
});

test('combined-summary provider failure does not pretend a summary was generated', async () => {
  const documents = [documentId, secondId].map((id, index) => ({ id, user_id: owner, file_path: `${owner}/${index}.png`, file_name: `${index}.png` }));
  const objects = new Map(documents.map(row => [`${row.file_path}.extraction.json`, Buffer.from(JSON.stringify({ mapping_version: MAPPING_VERSION, resume_data: profile }))]));
  const app = fixture({ documents, objects, summaryFails: true });
  const response = await app.request('documents/combine', { method: 'POST', body: { document_ids: [documentId, secondId] } });
  assert.equal(response.status, 502);
  assert.equal((await response.text()).includes(env.GEMINI_API_KEY), false);
});

test('grade mapping preserves explicit GPA and computes percentage only from stated totals', () => {
  const result = normalizeResumeData({ education: [{ degree: 'B.E.', gpa: 9.3, total_marks_obtained: 450, maximum_total_marks: 500 }] });
  assert.match(result.education[0].details, /GPA: 9.3/);
  assert.match(result.education[0].details, /Percentage \(calculated\): 90%/);
  assert.doesNotMatch(normalizeResumeData({ education: [{ degree: 'B.E.', cgpa: 9.3 }] }).education[0].details, /Percentage/);
});

test('standalone Node backend accepts the existing frontend multipart upload', async () => {
  const app = fixture({ handlerOptions: { allowMultipart: true, runtimeName: 'Node.js' } });
  const form = new FormData();
  form.append('files', new Blob([png], { type: 'image/png' }), 'certificate.png');
  const response = await app.request('upload', { method: 'POST', body: form });
  assert.equal(response.status, 200);
  const result = (await response.json()).results[0];
  assert.equal(result.success, true);
  assert.equal(result.filename, 'certificate.png');
  assert.equal(result.document_id, documentId);
  assert.equal(result.resume_data.personal.name, profile.personal.name);
  assert.equal(app.documents[0].user_id, owner);
  assert.ok(app.objects.has(app.documents[0].file_path));
});

test('standalone multipart uploads report partial failures without losing successful files', async () => {
  const app = fixture({ handlerOptions: { allowMultipart: true } });
  const form = new FormData();
  form.append('files', new Blob([png]), 'certificate.png');
  form.append('files', new Blob(['invalid-signature']), 'invalid.png');
  const response = await app.request('upload', { method: 'POST', body: form });
  const result = await response.json();
  assert.equal(result.successful_files, 1);
  assert.equal(result.failed_files, 1);
  assert.equal(app.documents.length, 1);
});

test('standalone download sends original binary content for the existing frontend', async () => {
  const path = `${owner}/scan.png`;
  const app = fixture({ documents: [{ id: documentId, user_id: owner, file_path: path, file_name: 'scan.png', mime_type: 'image/png' }], objects: new Map([[path, png]]), handlerOptions: { downloadMode: 'binary' } });
  const response = await app.request(`documents/${documentId}/file`);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.match(response.headers.get('content-disposition'), /scan.png/);
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), png);
  assert.equal((await app.request(`documents/${documentId}/file`, { token: 'foreign-token' })).status, 404);
});

test('standalone backend retains unprefixed Python API paths', async () => {
  const app = fixture({ handlerOptions: { runtimeName: 'Node.js' } });
  const health = await app.handler(new Request('http://backend.example/health'));
  assert.deepEqual(await health.json(), { status: 'healthy', runtime: 'Node.js' });
  const home = await app.handler(new Request('http://backend.example/'));
  assert.equal((await home.json()).status, 'online');
  const config = await app.handler(new Request('http://backend.example/auth/config'));
  assert.equal((await config.json()).anon_key, env.SUPABASE_ANON_KEY);
  const protectedResponse = await app.handler(new Request('http://backend.example/documents'));
  assert.equal(protectedResponse.status, 401);
});
