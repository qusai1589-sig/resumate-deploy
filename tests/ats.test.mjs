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
const weak = 'Jane Doe jane@example.com\nEducation\nCollege diploma 2023\nSkills\nCommunication\nSummary\nI am looking for a new opportunity and would love to join a company where I can learn new things and contribute to a team. I enjoy reading and spending time outdoors and meeting people.';
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

test('unrelated documents never receive a score', () => {
  const documents = [
    'Certificate of Completion\nThis is to certify Jane Doe jane@example.com completed education and skills training in React and Python at college in 2024. The student demonstrated leadership and projects during the course and achieved excellent performance.',
    'Invoice\nJane Doe jane@example.com\nEducation Services Company\nSkills training and projects workshop developed for college students. Payment due on 2026-10-01. Total amount 500 dollars including tax for technical experience training and consulting services rendered.',
    'Job Description\nWe are hiring an engineer. Education\nBachelor degree required. Skills\nReact SQL Python. Experience\nCandidates must have developed software for three years. Send applications to jobs@example.com and include your professional achievements and relevant background.',
    'Ingredients\nAdd flour and milk to a bowl and mix well. Bake for thirty minutes before serving. This recipe was developed over many years of experience and requires basic cooking skills and careful attention to the instructions.',
    'Research report\nThis paper describes the experience of students acquiring education and technical skills through projects at a university. We analyzed how training was delivered and supported learning across the college population and managed the experiment successfully.',
  ];
  for (const document of documents) assert.throws(() => analyzeResume(document), error => error.status === 422 && /identified as a resume/.test(error.message));
});

test('renaming a certificate to resume.txt does not bypass validation', async () => {
  const body = new FormData();
  body.append('resume', new Blob(['Certificate of Completion\nThis is to certify Jane Doe jane@example.com completed education and skills training in React and Python at college in 2024. The student demonstrated leadership and projects during the course and achieved excellent performance.']), 'resume.txt');
  await assert.rejects(analyzeRequest(new Request('http://localhost', { method: 'POST', body })), error => error.status === 422);
});

test('JSON resume submission cannot bypass document validation', async () => {
  await assert.rejects(analyzeRequest(new Request('http://localhost', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ resumeText: 'This is a long letter about education and skills and experience in general. We developed a plan for a college and managed projects across departments. Please review the documents attached and support the proposal with your feedback.' }) })), error => error.status === 422);
});

test('student resume with projects and no employment is accepted', () => {
  const result = analyzeResume(good.replace('Experience\nSoftware Engineer 2021 - 2025\n', ''));
  assert.equal(result.documentType, 'resume');
  assert.equal(result.methodologyVersion, 2);
});

test('resume with certifications later in the document is accepted', () => {
  assert.equal(analyzeResume(good + '\nCertifications\nCertificate of Completion in Python').documentType, 'resume');
});

test('missing contact details lowers score without rejecting a clear resume', () => {
  const result = analyzeResume(good.replace('jane@example.com +1 212 555 0100', ''));
  assert.ok(result.score < analyzeResume(good).score);
});

test('matching and unrelated jobs produce different scores on the same resume', () => {
  const unrelated = 'We need a marketing specialist with Sales Accounting Excel and Customer Service skills to manage campaigns and customer outreach across regional offices.';
  assert.ok(analyzeResume(good, jd).score > analyzeResume(good, unrelated).score);
});

test('flattened achievement lines preserve content score', () => {
  const flattened = good.replace('users.\nReduced', 'users. Reduced').replace('optimization.\nBuilt', 'optimization. Built');
  assert.equal(analyzeResume(flattened).contentQuality, analyzeResume(good).contentQuality);
});

test('invalid PDF and DOCX uploads return readable validation errors', async () => {
  for (const [name, contents] of [['resume.pdf', '%PDF-broken document'], ['resume.docx', 'PKnot-a-valid-archive']]) {
    const body = new FormData();
    body.append('resume', new Blob([contents]), name);
    await assert.rejects(analyzeRequest(new Request('http://localhost', { method: 'POST', body })), error => error.status === 422);
  }
});
