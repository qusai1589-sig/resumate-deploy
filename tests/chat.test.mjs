import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../server/api.mjs';
const alice = '11111111-1111-4111-8111-111111111111';
const bob = '22222222-2222-4222-8222-222222222222';
const id = '33333333-3333-4333-8333-333333333333';
function fixture({ missingStatus = 404, storageFailure } = {}) {
  const objects = new Map();
  let fail = false;
  let aiCalls = 0;
  let prompt;
  const handler = createHandler({ env: { SUPABASE_URL: 'https://db.example', SUPABASE_ANON_KEY: 'public', GROQ_API_KEY: 'secret' }, fetcher: async (address, options = {}) => {
    const url = new URL(address);
    const token = options.headers.Authorization;
    const owner = token === 'Bearer alice' ? alice : bob;
    const body = options.body ? JSON.parse(options.body) : null;
    if (url.pathname === '/auth/v1/user') return Response.json({ id: owner });
    if (url.hostname === 'api.groq.com') {
      aiCalls++; prompt = body.messages;
      assert.equal(objects.get(`${alice}/chat/${id}.json`)?.content, 'Help with my resume');
      return fail ? Response.json({}, { status: 429 }) : Response.json({ choices: [{ message: { content: 'Try an achievement bullet.' } }] });
    }
    if (url.pathname.endsWith('/list/uploads')) {
      assert.equal(body.prefix, `${owner}/chat/`);
      const names = [...objects.keys()].filter(key => key.startsWith(body.prefix));
      return Response.json(names.reverse().slice(body.offset, body.offset + body.limit).map(key => ({ name: key.split('/').at(-1) })));
    }
    if (storageFailure && url.pathname.startsWith('/storage/')) return Response.json(storageFailure, { status: 400 });
    const path = url.pathname.split('/uploads/')[1];
    assert.ok(path.startsWith(`${owner}/chat/`) || path === `${owner}/chat-profile.json`);
    if (options.method === 'POST') {
      if (objects.has(path) && options.headers['x-upsert'] === 'false') return Response.json({}, { status: 409 });
      objects.set(path, body); return Response.json({});
    }
    return objects.has(path) ? Response.json(objects.get(path)) : Response.json({ statusCode: '404', error: 'not_found', message: 'Object not found', code: 'NoSuchKey' }, { status: missingStatus });
  } });
  return { objects, setFail(value) { fail = value; }, async profile({ token = 'alice', body } = {}) { return handler(new Request('https://app.example/api/chat/profile', { method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) })); }, get aiCalls() { return aiCalls; }, get prompt() { return prompt; }, async request({ token = 'alice', body, offset } = {}) {
    return handler(new Request(`https://app.example/api/chat${offset === undefined ? '' : `?offset=${offset}`}`, { method: body ? 'POST' : 'GET', headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) }));
  } };
}
test('chat requires authentication and validates requests', async () => {
  const app = fixture();
  assert.equal((await app.request({ token: null })).status, 401);
  assert.equal((await app.request({ body: { id: '../another-account', content: 'Hi' } })).status, 400);
  assert.equal((await app.request({ offset: -1 })).status, 400);
});
test('questions survive provider failure, retries save replies, and saved retries are idempotent', async () => {
  const app = fixture();
  const body = { id, content: 'Help with my resume' };
  app.setFail(true);
  assert.equal((await app.request({ body })).status, 429);
  let history = await (await app.request()).json();
  assert.equal(history.turns[0].content, body.content);
  assert.equal(history.turns[0].reply, null);
  app.setFail(false);
  assert.equal((await app.request({ body })).status, 200);
  assert.equal((await app.request({ body })).status, 200);
  assert.equal(app.aiCalls, 2);
  history = await (await app.request()).json();
  assert.equal(history.turns.length, 1);
  assert.equal(history.turns[0].reply, 'Try an achievement bullet.');
  assert.deepEqual((await (await app.request({ token: 'bob' })).json()).turns, []);
  assert.equal((await app.request({ body: { id, content: 'Changed question' } })).status, 409);
});
test('new replies receive saved conversation context', async () => {
  const app = fixture();
  await app.request({ body: { id, content: 'Help with my resume' } });
  await app.request({ body: { id: '44444444-4444-4444-8444-444444444444', content: 'Continue please' } });
  assert.deepEqual(app.prompt.slice(1).map(message => message.content), ['Help with my resume', 'Try an achievement bullet.', 'Continue please']);
});

test('assistant name and photo persist per verified account', async () => {
  const app = fixture();
  const profile = { name: '  Nova  ', avatar: 'data:image/png;base64,' + Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64') };
  const response = await app.profile({ body: profile });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).profile.name, 'Nova');
  assert.equal((await (await app.profile()).json()).profile.avatar, profile.avatar);
  assert.deepEqual((await (await app.profile({ token: 'bob' })).json()).profile, { name: 'ResuMate', avatar: null });
  assert.equal((await app.profile({ token: null })).status, 401);
  await app.request({ body: { id, content: 'Help with my resume' } });
  assert.match(app.prompt[0].content, /Nova/);
});
test('profile rejects unsafe images, invalid signatures and invalid names', async () => {
  const app = fixture();
  for (const profile of [{ name: '' }, { name: 'x'.repeat(41) }, { name: 'Bad\nName' }, { name: 'Nova', avatar: 'https://external.example/avatar.png' }, { name: 'Nova', avatar: 'data:image/svg+xml;base64,PHN2Zz4=' }, { name: 'Nova', avatar: 'data:image/png;base64,YmFk' }, { name: 'Nova', avatar: 'x'.repeat(48001) }]) {
    assert.equal((await app.profile({ body: profile })).status, 400);
  }
  assert.equal(app.objects.size, 0);
});

test('Supabase HTTP 400 NoSuchKey initializes a first question and missing profile', async () => {
  const app = fixture({ missingStatus: 400 });
  assert.deepEqual((await (await app.profile()).json()).profile, { name: 'ResuMate', avatar: null });
  const response = await app.request({ body: { id, content: 'Help with my resume' } });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).turn.reply, 'Try an achievement bullet.');
  assert.equal(app.aiCalls, 1);
  assert.equal((await (await app.request()).json()).turns.length, 1);
});
test('legacy HTTP 400 missing-object response also initializes an empty profile', async () => {
  const app = fixture({ storageFailure: { statusCode: '404', error: 'not_found', message: 'Object not found' } });
  assert.deepEqual((await (await app.profile()).json()).profile, { name: 'ResuMate', avatar: null });
});
test('wrapped permission and bucket errors are reported rather than treated as empty chat', async () => {
  for (const [failure, expected, message] of [
    [{ statusCode: '403', code: 'AccessDenied', message: 'Access denied' }, 403, /permissions/],
    [{ statusCode: '404', code: 'NoSuchBucket', message: 'Bucket not found' }, 503, /bucket/],
    [{ statusCode: '400', code: 'InvalidRequest', message: 'Bad request' }, 502, /load/],
  ]) {
    const app = fixture({ storageFailure: failure });
    const response = await app.profile();
    assert.equal(response.status, expected);
    assert.match((await response.json()).detail, message);
    assert.equal(app.aiCalls, 0);
    assert.equal(app.objects.size, 0);
  }
});
