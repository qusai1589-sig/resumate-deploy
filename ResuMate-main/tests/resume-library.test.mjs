import test from 'node:test';
import assert from 'node:assert/strict';
import { listSavedResumes, saveResume } from '../src/services/resumeLibrary.js';
import { emptyResume } from '../src/services/documentResume.js';
function storage() {
  const values = new Map();
  globalThis.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}

test('saved resumes persist as editable snapshots and stay separated by account', () => {
  storage(); const draft = emptyResume(); draft.personal.name = 'Qusai'; draft.achievements = ['Completed Python Basics'];
  const saved = saveResume('owner-a', draft, 'modern');
  draft.personal.name = 'Later edit';
  assert.equal(listSavedResumes('owner-a')[0].resume.personal.name, 'Qusai');
  assert.deepEqual(listSavedResumes('owner-b'), []);
  assert.equal(saved.entry.template, 'modern');
});

test('saving an opened draft updates its existing entry instead of duplicating it', () => {
  storage(); const draft = emptyResume();
  const first = saveResume('owner-a', draft, 'modern'); draft.personal.name = 'Edited Name';
  saveResume('owner-a', draft, 'professional', first.entry.id);
  const entries = listSavedResumes('owner-a');
  assert.equal(entries.length, 1); assert.equal(entries[0].resume.personal.name, 'Edited Name'); assert.equal(entries[0].template, 'professional');
});
