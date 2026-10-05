import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';

class Storage {
  values = new Map();
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
const session = () => ({ access_token: 'test-access', refresh_token: 'test-refresh', expires_in: 3600, user: { id: 'test-owner' } });
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
let sequence = 0;
async function loadAuth({ googleEnabled = true, initial, url = 'http://localhost:5173/', remote } = {}) {
  globalThis.localStorage = new Storage();
  globalThis.sessionStorage = new Storage();
  if (initial) localStorage.setItem('resumate.auth.session', JSON.stringify(initial));
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
  const location = new URL(url);
  const state = { assigned: null, replaced: null, calls: [] };
  globalThis.window = { location: { href: location.href, origin: location.origin, pathname: location.pathname, assign: value => { state.assigned = value; } },
    history: { replaceState: (_state, _title, value) => { state.replaced = String(value); } }, addEventListener() {} };
  globalThis.fetch = async (url, options = {}) => {
    state.calls.push({ url: String(url), options });
    if (String(url).endsWith('/auth/config')) return json({ url: 'https://supabase.test', anon_key: 'public-test-key' });
    if (String(url).endsWith('/auth/v1/settings')) return json({ external: { google: googleEnabled } });
    return remote ? remote(String(url), options) : json(session());
  };
  const source = (await readFile(new URL('../src/services/authService.js', import.meta.url), 'utf8')).replace('import.meta.env.VITE_API_BASE_URL', 'undefined');
  const moduleURL = `data:text/javascript;base64,${Buffer.from(source + `\n// test ${sequence++}`).toString('base64')}`;
  return { auth: await import(moduleURL), state, moduleURL };
}

test('password login persists refreshable session and notifies the app', async () => {
  const { auth, state } = await loadAuth();
  const client = await auth.getAuthClient();
  let event;
  client.auth.onAuthStateChange(value => { event = value; });
  assert.equal(await auth.authenticate('signin', 'test@example.invalid', 'test-password'), true);
  assert.equal(event, 'SIGNED_IN');
  assert.equal((await client.auth.getSession()).data.session.user.id, 'test-owner');
  const request = state.calls.find(call => call.url.endsWith('/login'));
  assert.deepEqual(JSON.parse(request.options.body), { email: 'test@example.invalid', password: 'test-password' });
  assert.ok(JSON.parse(localStorage.getItem('resumate.auth.session')).expires_at > Date.now() / 1000);
});

test('confirmation-only signup does not create a session', async () => {
  const { auth } = await loadAuth({ remote: () => json({ message: 'Confirm your email', access_token: null, refresh_token: null }) });
  assert.equal(await auth.authenticate('signup', 'test@example.invalid', 'test-password'), false);
  assert.equal(localStorage.getItem('resumate.auth.session'), null);
});

test('expired session refreshes before requests and invalid refresh clears local access', async () => {
  const { auth, state } = await loadAuth({ initial: { ...session(), expires_at: 1 } });
  const client = await auth.getAuthClient();
  assert.equal((await client.auth.getSession()).data.session.access_token, 'test-access');
  assert.ok(state.calls.some(call => call.url.endsWith('token?grant_type=refresh_token')));
  const invalid = await loadAuth({ initial: { ...session(), expires_at: 1 }, remote: () => json({ message: 'Expired refresh token' }, 400) });
  const invalidClient = await invalid.auth.getAuthClient();
  assert.ok((await invalidClient.auth.getSession()).error);
  assert.equal(localStorage.getItem('resumate.auth.session'), null);
});

test('Google login generates a PKCE challenge and local callback URL', async () => {
  const { auth, state } = await loadAuth();
  await auth.googleLogin();
  const redirect = new URL(state.assigned);
  const verifier = sessionStorage.getItem('resumate.auth.verifier');
  const expected = Buffer.from(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))).toString('base64url');
  assert.equal(redirect.searchParams.get('provider'), 'google');
  assert.equal(redirect.searchParams.get('code_challenge'), expected);
  assert.equal(redirect.searchParams.get('redirect_to'), 'http://localhost:5173/');
  assert.equal(redirect.searchParams.get('code_challenge_method'), 's256');
});

test('Google callback exchanges the code once and removes it from browser history', async () => {
  const { auth, state } = await loadAuth({ url: 'http://localhost:5173/?code=test-code' });
  sessionStorage.setItem('resumate.auth.verifier', 'test-verifier');
  const client = await auth.getAuthClient();
  assert.equal((await client.auth.getSession()).data.session.user.id, 'test-owner');
  const call = state.calls.find(call => call.url.endsWith('token?grant_type=pkce'));
  assert.deepEqual(JSON.parse(call.options.body), { auth_code: 'test-code', code_verifier: 'test-verifier' });
  assert.equal(new URL(state.replaced).searchParams.has('code'), false);
  assert.equal(sessionStorage.getItem('resumate.auth.verifier'), null);
});

test('document client sends bearer auth, multipart bytes, and private downloads', async () => {
  const { auth, state, moduleURL } = await loadAuth({ initial: { ...session(), expires_at: Date.now() / 1000 + 3600 }, remote: (url) => url.endsWith('/file') ? new Response('private-file') : json({ documents: [] }) });
  await auth.getAuthClient();
  let clicked = false;
  window.document = { createElement: () => ({ click: () => { clicked = true; } }) };
  const source = (await readFile(new URL('../src/services/apiClient.js', import.meta.url), 'utf8'))
    .replace("'./authService'", JSON.stringify(moduleURL)).replace('import.meta.env.VITE_API_BASE_URL', 'undefined');
  const { apiClient } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  await apiClient.get('/documents');
  const form = new FormData(); form.append('files', new Blob(['test-file']), 'test.pdf');
  await apiClient.post('/upload', form);
  await apiClient.download({ id: 'test-document', file_name: 'private.pdf' });
  assert.ok(clicked);
  const upload = state.calls.find(call => call.url.endsWith('/upload'));
  assert.equal(upload.options.body, form);
  assert.equal(upload.options.headers.Authorization, 'Bearer test-access');
  assert.equal(upload.options.headers['Content-Type'], undefined);
  assert.ok(state.calls.some(call => call.url.endsWith('/documents/test-document/file')));
});

test('signout clears local session even when the remote service is unavailable', async () => {
  const { auth } = await loadAuth({ initial: { ...session(), expires_at: Date.now() / 1000 + 3600 }, remote: () => { throw new Error('Offline'); } });
  const client = await auth.getAuthClient();
  await client.auth.signOut();
  assert.equal((await client.auth.getSession()).data.session, null);
});


test('disabled Google provider stays on the login screen with a clear error', async () => {
  const { auth, state } = await loadAuth({ googleEnabled: false });
  await assert.rejects(auth.googleLogin(), /Google sign-in is not enabled/);
  assert.equal(state.assigned, null);
  assert.equal(sessionStorage.getItem('resumate.auth.verifier'), null);
});
