import test from 'node:test';
import assert from 'node:assert/strict';
import { applyDocumentToResume, emptyResume, hasResumeFacts } from '../../src/services/documentResume.js';

test('certificate recipient fills the editable name and achievements without inserting filename', () => {
  const resume = applyDocumentToResume(emptyResume(), { id: 'certificate-1', file_name: 'random-upload.png', resume_data: {
    personal: { name: 'Qusai Khanorwala' }, achievements: ['Completed Python Basics — Learning Institute, September 2026'],
  } });
  assert.equal(resume.personal.name, 'Qusai Khanorwala');
  assert.deepEqual(resume.achievements, ['Completed Python Basics — Learning Institute, September 2026']);
  assert.equal(resume.personal.email, '');
  assert.deepEqual(resume.education, []);
  assert.equal(JSON.stringify(resume).includes('random-upload.png'), false);
});

test('education, internships, projects, and skills go into their corresponding fields', () => {
  const result = applyDocumentToResume(emptyResume(), { id: 'document-2', resume_data: {
    personal: { name: 'Test Candidate', email: 'candidate@example.invalid' },
    education: [{ degree: 'BSc', institution: 'Example College', year: '2026', details: 'Grade A' }],
    experience: [{ role: 'Intern', company: 'Example Company', duration: 'May 2026', description: 'Built a dashboard' }],
    projects: [{ name: 'Dashboard', technologies: 'Python', description: 'Visualized data', link: '' }],
    skills: ['Python', 'SQL'], summary: 'Completed an internship building a dashboard.',
  } });
  assert.equal(result.education[0].institution, 'Example College');
  assert.equal(result.experience[0].role, 'Intern');
  assert.equal(result.projects[0].name, 'Dashboard');
  assert.equal(result.personal.email, 'candidate@example.invalid');
  assert.deepEqual(result.skills, ['Python', 'SQL']);
});

test('importing a second document preserves existing edits and avoids duplicate facts', () => {
  const draft = emptyResume(); draft.personal.name = 'User correction'; draft.personal.email = 'edited@example.invalid';
  draft.skills = ['Python']; draft.achievements = ['Existing award'];
  const result = applyDocumentToResume(draft, { id: 'second', resume_data: { skills: ['Python', 'SQL'], achievements: ['Existing award', 'New award'] } });
  assert.equal(result.personal.name, 'User correction');
  assert.equal(result.personal.email, 'edited@example.invalid');
  assert.deepEqual(result.skills, ['Python', 'SQL']);
  assert.deepEqual(result.achievements, ['Existing award', 'New award']);
  assert.equal(draft.skills.length, 1);
});

test('reopening an already imported document does not overwrite corrected data', () => {
  const document = { id: 'same', resume_data: { personal: { name: 'OCR spelling' } } };
  const draft = applyDocumentToResume(emptyResume(), document);
  draft.personal.name = 'Corrected spelling';
  assert.equal(applyDocumentToResume(draft, document).personal.name, 'Corrected spelling');
});

test('unsupported object values and empty facts do not become resume content', () => {
  assert.equal(hasResumeFacts({}), false);
  assert.ok(hasResumeFacts({ personal: { name: 'Candidate' } }));
  const result = applyDocumentToResume(emptyResume(), { file_name: 'only-name.png', resume_data: { personal: { name: { signer: 'Someone' } }, skills: [{ madeUp: true }] } });
  assert.equal(result.personal.name, ''); assert.deepEqual(result.skills, []);
});

test('original template content stays visible and extracted education replaces its example row', async () => {
  const { templateResume } = await import('../../src/services/documentResume.js');
  const original = templateResume();
  assert.equal(original.personal.name, 'Your Name');
  assert.equal(original.personal.title, 'Computer Engineering Student');
  assert.ok(original.experience.length && original.projects.length && original.education.length);
  const result = applyDocumentToResume(original, { id: 'marksheet', resume_data: {
    personal: { name: 'Qusai', title: 'Computer Engineer' },
    education: [{ degree: 'B.E. Computer Engineering', institution: 'Actual College', year: '2026', details: 'CGPA: 9.3; Percentage: 89%; Grade: A' }],
  }, resume_summary: 'Qusai achieved a CGPA of 9.3 in Computer Engineering.' });
  assert.equal(result.personal.name, 'Qusai'); assert.equal(result.personal.title, 'Computer Engineer');
  assert.equal(result.education.length, 1); assert.equal(result.education[0].institution, 'Actual College');
  assert.ok(result.education[0].details.includes('9.3'));
  assert.equal(result.summary, 'Qusai achieved a CGPA of 9.3 in Computer Engineering.');
  assert.deepEqual(result.projects, original.projects);
});

test('a richer extraction of the same document can fill details absent in an older saved draft', () => {
  const first = applyDocumentToResume(emptyResume(), { id: 'same', resume_data: { personal: { name: 'Qusai' } } });
  const improved = applyDocumentToResume(first, { id: 'same', resume_data: { personal: { name: 'Qusai' }, education: [{ degree: 'Class XII', details: 'Percentage: 90%' }] } });
  assert.equal(improved.education[0].details, 'Percentage: 90%');
});
