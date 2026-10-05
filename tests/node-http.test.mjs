import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable, Writable } from 'node:stream';
import { once } from 'node:events';
import { createNodeListener, MAX_MULTIPART_BYTES } from '../server/http.mjs';

class Output extends Writable {
  headersSent = false;
  chunks = [];
  writeHead(status, headers) { this.statusCode = status; this.headers = headers; this.headersSent = true; }
  _write(chunk, _encoding, callback) { this.chunks.push(Buffer.from(chunk)); callback(); }
  text() { return Buffer.concat(this.chunks).toString(); }
}

async function call(listener, { method = 'GET', path = '/health', headers = {}, body = '' } = {}) {
  const incoming = Readable.from(body ? [Buffer.from(body)] : []);
  incoming.method = method;
  incoming.url = path;
  incoming.headers = headers;
  const output = new Output();
  const finished = once(output, 'finish');
  await listener(incoming, output);
  await finished;
  return output;
}

test('HTTP adapter runs the real health handler with no OCR model or secrets required', async () => {
  const output = await call(createNodeListener({ env: {} }));
  assert.equal(output.statusCode, 200);
  assert.deepEqual(JSON.parse(output.text()), { status: 'healthy', runtime: 'Node.js' });
});

test('CORS allows the configured Vercel frontend and exposes download headers', async () => {
  const origin = 'https://resumate-deploy.vercel.app';
  const listener = createNodeListener({ env: { FRONTEND_ORIGINS: origin } });
  const output = await call(listener, { headers: { origin } });
  assert.equal(output.headers['Access-Control-Allow-Origin'], origin);
  assert.equal(output.headers['Access-Control-Expose-Headers'], 'Content-Disposition');
  const preflight = await call(listener, { method: 'OPTIONS', path: '/upload', headers: { origin } });
  assert.equal(preflight.statusCode, 204);
  assert.match(preflight.headers['Access-Control-Allow-Headers'], /Authorization/);
  const denied = await call(listener, { method: 'OPTIONS', headers: { origin: 'https://foreign.example' } });
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.headers['Access-Control-Allow-Origin'], undefined);
});

test('HTTP adapter rejects oversized JSON and multipart requests before executing the API', async () => {
  let invoked = false;
  const listener = createNodeListener({ handler: async () => { invoked = true; return Response.json({}); } });
  for (const headers of [{ 'content-type': 'application/json', 'content-length': String(65 * 1024) }, { 'content-type': 'multipart/form-data; boundary=test', 'content-length': String(MAX_MULTIPART_BYTES + 1) }]) {
    const output = await call(listener, { method: 'POST', path: '/upload', headers });
    assert.equal(output.statusCode, 413);
  }
  assert.equal(invoked, false);
});

test('HTTP adapter caps JSON even when content-length is absent', async () => {
  const listener = createNodeListener({ handler: async () => { throw new Error('Must not execute'); } });
  const output = await call(listener, { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'x'.repeat(65 * 1024) });
  assert.equal(output.statusCode, 413);
});

test('HTTP adapter streams original document bytes and passes bearer tokens', async () => {
  const listener = createNodeListener({ handler: async request => {
    assert.equal(request.headers.get('authorization'), 'Bearer synthetic-test-token');
    assert.equal(new URL(request.url).pathname, '/documents/test/file');
    return new Response(Buffer.from([137, 80, 78, 71]), { headers: { 'Content-Type': 'image/png', 'Content-Disposition': 'attachment; filename=test.png' } });
  } });
  const output = await call(listener, { path: '/documents/test/file', headers: { authorization: 'Bearer synthetic-test-token' } });
  assert.equal(output.headers['content-type'], 'image/png');
  assert.deepEqual(Buffer.concat(output.chunks), Buffer.from([137, 80, 78, 71]));
});

test('HEAD health requests return headers without response bytes', async () => {
  const output = await call(createNodeListener({ env: {} }), { method: 'HEAD' });
  assert.equal(output.statusCode, 200);
  assert.equal(output.text(), '');
});

test('HTTP adapter never returns private exception details', async () => {
  const listener = createNodeListener({ handler: async () => { throw new Error('private-provider-key'); } });
  const output = await call(listener);
  assert.equal(output.statusCode, 500);
  assert.equal(output.text().includes('private-provider-key'), false);
});
