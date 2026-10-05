import test from 'node:test';
import assert from 'node:assert/strict';
import { extractDocument } from '../server/ai.mjs';
import { renderPdfPages } from '../server/pdf-pages.mjs';

const env = { GEMINI_API_KEY: 'private-gemini-test', GROQ_API_KEY: 'private-groq-test', GROQ_MODEL: 'text-only-summary-model' };
const facts = { document_type: 'Certificate', resume_data: { personal: { name: 'Qusai', title: 'Computer Engineering' }, education: [{ degree: 'B.E.', institution: 'College', details: 'CGPA: 9.3' }], achievements: ['Python certificate'], skills: ['Python'] } };
const image = Buffer.from('private-image-bytes');
const geminiResult = output => Response.json({ candidates: [{ content: { parts: [{ text: output }] } }] });
const groqResult = output => Response.json({ choices: [{ message: { content: output } }] });

for (const failure of [400, 401, 403, 404, 429, 500, 'network', 'invalid-json', 'empty-facts']) {
  test(`Groq reads private image when Gemini fails with ${failure}`, async () => {
    const calls = [];
    const fetcher = async (url, options) => {
      calls.push({ url, options });
      if (url.includes('googleapis')) {
        if (failure === 'network') throw new Error(env.GEMINI_API_KEY);
        if (failure === 'invalid-json') return geminiResult('broken');
        if (failure === 'empty-facts') return geminiResult('{}');
        return Response.json({ error: env.GEMINI_API_KEY }, { status: failure });
      }
      assert.equal(options.headers.Authorization, `Bearer ${env.GROQ_API_KEY}`);
      const payload = JSON.parse(options.body);
      assert.equal(payload.model, 'qwen/qwen3.8-27b');
      assert.equal(payload.response_format.type, 'json_object');
      assert.equal(payload.messages[0].content[1].image_url.url, `data:image/jpeg;base64,${image.toString('base64')}`);
      return groqResult(JSON.stringify(facts));
    };
    const result = await extractDocument(image, 'image/jpeg', env, fetcher);
    assert.equal(calls.length, 2);
    assert.equal(result.resume_data.personal.name, 'Qusai');
    assert.match(result.resume_data.education[0].details, /9.3/);
    assert.deepEqual(result.resume_data.achievements, ['Python certificate']);
  });
}

test('successful Gemini extraction never calls Groq', async () => {
  let calls = 0;
  await extractDocument(image, 'image/png', env, async url => {
    assert.match(url, /googleapis/); calls++;
    return geminiResult(JSON.stringify(facts));
  });
  assert.equal(calls, 1);
});

test('Groq-only extraction supports missing Gemini key and configured vision model', async () => {
  await extractDocument(image, 'image/webp', { GROQ_API_KEY: env.GROQ_API_KEY, GROQ_VISION_MODEL: 'account-vision-model' }, async (url, options) => {
    assert.match(url, /api.groq.com/);
    assert.equal(JSON.parse(options.body).model, 'account-vision-model');
    return groqResult(JSON.stringify(facts));
  });
});

test('PDF fallback sends all pages in batches of three and merges later-page facts', async () => {
  let batches = 0;
  async function* pages(bytes) {
    assert.equal(bytes.toString(), '%PDF-test');
    for (let i = 0; i < 4; i++) yield Buffer.from(`page${i}`);
  }
  const result = await extractDocument(Buffer.from('%PDF-test'), 'application/pdf', env, async (url, options) => {
    if (url.includes('googleapis')) return Response.json({}, { status: 429 });
    const images = JSON.parse(options.body).messages[0].content.slice(1);
    assert.equal(images.length, batches === 0 ? 3 : 1);
    for (const entry of images) assert.match(entry.image_url.url, /^data:image\/png;base64,/);
    batches++;
    return groqResult(JSON.stringify(batches === 1 ? facts : { resume_data: { personal: { name: 'Qusai' }, achievements: ['Final-page award'] } }));
  }, { pdfPages: pages });
  assert.equal(batches, 2);
  assert.deepEqual(result.resume_data.achievements, ['Python certificate', 'Final-page award']);
});

for (const status of [401, 403, 404, 429, 500]) {
  test(`Groq failure ${status} produces safe actionable error`, async () => {
    await assert.rejects(extractDocument(image, 'image/png', env, async url => Response.json({ error: `${env.GROQ_API_KEY} private document` }, { status: url.includes('googleapis') ? 429 : status })), error => {
      assert.equal(error.status, status === 429 ? 429 : 502);
      assert.match(error.message, /Groq/);
      assert.equal(error.message.includes(env.GROQ_API_KEY), false);
      assert.equal(error.message.includes('private document'), false);
      return true;
    });
  });
}

test('invalid Groq facts are rejected rather than substituting filenames', async () => {
  await assert.rejects(extractDocument(image, 'image/png', env, async url => url.includes('googleapis') ? geminiResult('bad') : groqResult('{}')), /No resume information/);
});

test('PDF renderer rejects long PDFs before rendering and frees resources', async () => {
  let destroyed = false;
  const loadPdf = async () => async () => ({ length: 13, destroy: async () => { destroyed = true; }, async *[Symbol.asyncIterator]() { yield assert.fail('must not render'); } });
  await assert.rejects(async () => { for await (const page of renderPdfPages(image, { loadPdf })) void page; }, /12 pages/);
  assert.equal(destroyed, true);
});

test('PDF renderer frees resources when consumer stops early', async () => {
  let destroyed = false;
  const loadPdf = async () => async () => ({ length: 2, destroy: async () => { destroyed = true; }, async *[Symbol.asyncIterator]() { yield image; yield image; } });
  for await (const page of renderPdfPages(image, { loadPdf })) { assert.equal(page, image); break; }
  assert.equal(destroyed, true);
});


test('blank final PDF pages do not discard earlier extracted facts', async () => {
  let batches = 0;
  async function* pages() { for (let i = 0; i < 4; i++) yield image; }
  const result = await extractDocument(image, 'application/pdf', env, async url => {
    if (url.includes('googleapis')) return Response.json({}, { status: 429 });
    return groqResult(JSON.stringify(batches++ === 0 ? facts : { resume_data: {} }));
  }, { pdfPages: pages });
  assert.equal(result.resume_data.personal.name, 'Qusai');
});
