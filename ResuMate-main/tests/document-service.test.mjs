import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

let sequence = 0;
async function service(api) {
  globalThis.documentTestApi = api;
  globalThis.documentTestOwner = 'owner-a';
  const moduleURL = source => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
  const apiURL = moduleURL('export default { get: (...args) => globalThis.documentTestApi.get(...args), post: (...args) => globalThis.documentTestApi.post(...args) };');
  const authURL = moduleURL('export const getAuthClient = async () => ({ auth: { getSession: async () => ({ data: { session: { user: { id: globalThis.documentTestOwner } } } }) } });');
  const mappingURL = moduleURL(await readFile(new URL('../src/services/documentResume.js', import.meta.url), 'utf8'));
  const source = (await readFile(new URL('../src/services/documentService.js', import.meta.url), 'utf8'))
    .replace("'./apiClient'", JSON.stringify(apiURL)).replace("'./authService'", JSON.stringify(authURL)).replace("'./documentResume'", JSON.stringify(mappingURL));
  return import(moduleURL(source + `\n// document test ${sequence++}`));
}
const record = { id: 'document-a', user_id: 'owner-a', file_name: 'scan.png', file_path: 'owner-a/scan.png' };
const facts = { personal: { name: 'Qusai Khanorwala' }, achievements: ['Completed Python Basics'] };
const file = () => ({ size: 100, name: 'scan.png' });

// FormData in Node requires a Blob; browsers supply actual File objects.
const certificate = () => Object.assign(new Blob(['test-image']), { name: 'scan.png' });

test('upload facts remain usable after returning to vault without a second extraction request', async () => {
  let posts = 0;
  const module = await service({ get: async () => ({ documents: [record] }), post: async endpoint => {
    posts++; assert.equal(endpoint, '/upload');
    return { results: [{ success: true, storage_path: record.file_path, resume_data: facts }] };
  } });
  const upload = await module.uploadDocuments([certificate()]);
  assert.equal(upload.uploaded[0].resume_data.personal.name, 'Qusai Khanorwala');
  const reused = await module.getDocumentForResume(record);
  assert.deepEqual(reused.resume_data, facts);
  assert.equal(posts, 1);
});

test('older documents request the owner-protected extraction route', async () => {
  const module = await service({ post: async endpoint => { assert.equal(endpoint, '/documents/document-a/extraction'); return { resume_data: facts }; } });
  assert.equal((await module.getDocumentForResume(record)).resume_data.personal.name, 'Qusai Khanorwala');
});

test('missing API route is distinguished from an unavailable document', async () => {
  for (const [detail, pattern] of [['Not Found', /Restart the backend/], ['Document not found', /could not be found in your account/]]) {
    const module = await service({ post: async () => { const error = new Error(detail); error.status = 404; error.detail = detail; throw error; } });
    await assert.rejects(module.getDocumentForResume(record), pattern);
  }
});

test('cached extraction is scoped to the signed-in owner', async () => {
  const module = await service({ get: async () => ({ documents: [record] }), post: async endpoint => {
    if (endpoint === '/upload') return { results: [{ success: true, storage_path: record.file_path, resume_data: facts }] };
    const error = new Error('Document not found'); error.status = 404; throw error;
  } });
  await module.uploadDocuments([certificate()]);
  globalThis.documentTestOwner = 'owner-b';
  await assert.rejects(module.getDocumentForResume(record), /could not be found/);
});

test('the inserted document ID keeps new upload usable if document listing fails', async () => {
  const module = await service({ get: async () => { throw new Error('List unavailable'); }, post: async () => ({ results: [{ success: true, document: record, document_id: record.id, storage_path: record.file_path, resume_data: facts }] }) });
  const upload = await module.uploadDocuments([certificate()]);
  assert.equal(upload.uploaded[0].id, record.id);
  assert.equal((await module.getDocumentForResume(upload.uploaded[0])).resume_data.personal.name, 'Qusai Khanorwala');
});

test('legacy extraction fields map to facts without using the uploaded filename', async () => {
  const module = await service({});
  const result = module.normalizeExtraction({ filename: 'random.png', structured_data: { recipient_name: 'Qusai', certificate_name: 'Python Course', issuer: 'Test Institute' } });
  assert.equal(result.resume_data.personal.name, 'Qusai');
  assert.deepEqual(result.resume_data.achievements, ['Python Course — Test Institute']);
  assert.equal(JSON.stringify(result.resume_data).includes('random.png'), false);
});

test('invalid upload counts and sizes are rejected before calling the backend', async () => {
  const module = await service({ post: () => { throw new Error('Must not be called'); } });
  await assert.rejects(module.uploadDocuments([]), /between 1 and 5/);
  await assert.rejects(module.uploadDocuments(Array.from({ length: 6 }, file)), /between 1 and 5/);
  await assert.rejects(module.uploadDocuments([{ ...file(), size: 11 * 1024 * 1024 }]), /10 MB/);
});

test('multiple certificates are sent to the combined-summary endpoint with their IDs', async () => {
  const second = { ...record, id: 'document-b' };
  const module = await service({ post: async (endpoint, body) => {
    assert.equal(endpoint, '/documents/combine');
    assert.deepEqual(body.document_ids, ['document-a', 'document-b']);
    return { id: 'combined:a,b', source_document_ids: body.document_ids, resume_data: facts, resume_summary: 'Combined candidate summary.' };
  } });
  const result = await module.combineDocumentsForResume([record, second]);
  assert.equal(result.resume_data.summary, 'Combined candidate summary.');
  assert.equal(result.source_document_ids.length, 2);
});

test('combining rejects a single document, duplicates, and a foreign owner', async () => {
  const module = await service({ post: async () => { throw new Error('Must not call backend'); } });
  await assert.rejects(module.combineDocumentsForResume([record]), /between 2 and 5/);
  await assert.rejects(module.combineDocumentsForResume([record, record]), /different saved documents/);
  await assert.rejects(module.combineDocumentsForResume([record, { ...record, id: 'foreign', user_id: 'owner-b' }]), /own vault/);
});
