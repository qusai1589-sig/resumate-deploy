import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeResume, analyzeRequest } from '../server/ats.mjs';
const good = `Jane Doe jane@example.com +1 212 555 0100
Summary
Software engineer developing customer applications with React JavaScript SQL Docker and Git.
Experience
Software Engineer 2021 - 2025
Developed React applications serving 500 users.
Reduced processing time by 30% through SQL optimization.
Built Docker deployment pipelines and implemented automated testing.
Education
Bachelor of Computer Science 2021
Skills
React JavaScript SQL Docker Git Python
Projects
Created an analytics dashboard for customers and delivered reporting tools supporting daily business decisions across multiple teams.`;
const weak = 'I am looking for a new opportunity and would love to join a company where I can learn new things and contribute to a team. I enjoy reading and spending time outdoors and meeting people.';
const jd = 'We require a software engineer with React JavaScript SQL Docker and TypeScript skills to develop applications and build customer reporting tools.';
test('actual resume quality changes score', () => assert.ok(analyzeResume(good).score > analyzeResume(weak).score));
test('job keywords are derived from the provided job and use token boundaries', () => {
  const result = analyzeResume(good, jd);
  assert.ok(result.matchedKeywords.includes('React'));
  assert.ok(result.missingKeywords.includes('TypeScript'));
  assert.ok(!result.matchedKeywords.includes('Java'));
  assert.ok(analyzeResume(good + '\nTypeScript', jd).score >= result.score);
});
test('general review does not fabricate matching metrics', () => {
  const result = analyzeResume(good);
  assert.equal(result.keywordMatch, null);
  assert.equal(result.skillsMatch, null);
  assert.equal(result.experienceMatch, null);
  assert.deepEqual(result.missingKeywords, []);
});
test('empty/scanned and oversized text rejected', () => {
  assert.throws(() => analyzeResume(''), /Too little/);
  assert.throws(() => analyzeResume('a'.repeat(100001)), /100,000/);
  assert.throws(() => analyzeResume(good, 'React developer'), /full job/);
});
test('plain text uploads are actually read', async () => {
  const body = new FormData();
  body.append('resume', new Blob([good]), 'resume.txt');
  body.append('jobDescription', jd);
  const result = await analyzeRequest(new Request('http://localhost/api/ats/analyze', { method: 'POST', body }));
  assert.equal(result.source, 'txt');
  assert.equal(result.score, analyzeResume(good, jd).score);
});
test('unsupported uploads rejected', async () => {
  const body = new FormData();
  body.append('resume', new Blob([good]), 'resume.doc');
  await assert.rejects(analyzeRequest(new Request('http://localhost/api/ats/analyze', { method: 'POST', body })), /legacy DOC/);
});
