import { requireCondition, readJson } from './errors.mjs';

const skills = ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'C++', 'C#', 'SQL', 'PostgreSQL', 'MongoDB', 'HTML', 'CSS', 'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'Linux', 'REST API', 'CI/CD', 'Excel', 'Tableau', 'Power BI', 'Figma', 'Accounting', 'Sales', 'Marketing', 'Project Management', 'Customer Service', 'Communication', 'Leadership', 'Data Analysis', 'Machine Learning'];
const aliases = { 'Node.js': ['nodejs', 'node.js'], 'REST API': ['rest api', 'rest apis', 'restful'], 'CI/CD': ['ci/cd', 'continuous integration'], React: ['react', 'reactjs', 'react.js'] };
const stop = new Set('the and for with you your our are will have has this that from must should required preferred experience years year work working role job team company candidate skills ability strong excellent knowledge including responsibilities requirements qualification qualifications looking seeking join about benefits equal opportunity employer all any more such other their they who can in on of to a an be as is or we at by it us'.split(' '));
const normalized = value => value.toLowerCase().replace(/[‐‑–—]/g, '-');
function contains(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, 'i').test(text);
}
const matches = (text, skill) => (aliases[skill] || [skill.toLowerCase()]).some(term => contains(text, term));
const percent = (count, total) => total ? Math.round(count / total * 100) : null;

export function analyzeResume(resumeText, jobDescription = '', { pages = null, source = 'text' } = {}) {
  requireCondition(typeof resumeText === 'string' && resumeText.length <= 100000, 400, 'Resume text must be at most 100,000 characters.');
  requireCondition(typeof jobDescription === 'string' && jobDescription.length <= 20000, 400, 'Job description must be at most 20,000 characters.');
  const text = normalized(resumeText);
  const words = text.match(/[\p{L}\p{N}+#.]+/gu) || [];
  requireCondition(words.length >= 30, 422, 'Too little readable resume text. Upload a text-based resume or use your saved resume. Scanned PDFs need OCR first.');
  const jd = normalized(jobDescription.trim());
  requireCondition(!jd || (jd.match(/\S+/g) || []).length >= 15, 400, 'Add a full job description (at least 15 words), or leave it blank for a general review.');
  const sections = Object.fromEntries(Object.entries({ experience: /\b(experience|employment|work history|internships?)\b/, projects: /\bprojects?\b/, education: /\b(education|qualifications|academic)\b/, skills: /\b(skills|competencies|technical expertise)\b/, summary: /\b(summary|profile|objective)\b/ }).map(([key, expression]) => [key, expression.test(text)]));
  const email = /[\w.+-]+@[\w.-]+\.[a-z]{2,}/i.test(text);
  const phone = /(?:\+?\d[\d ().-]{7,}\d)/.test(text);
  const dates = /\b(?:19|20)\d{2}\b/.test(text);
  const lines = resumeText.split(/\n+/).map(line => line.trim()).filter(Boolean);
  const actionLines = lines.filter(line => /\b(built|developed|led|managed|created|designed|implemented|improved|increased|reduced|delivered|analyzed|automated|supported|organized|trained|resolved|launched)\b/i.test(line));
  const impactLines = actionLines.filter(line => /\d+(?:\.\d+)?\s*(?:%|percent|users|customers|clients|hours|days|million|projects|employees)|[$₹€£]\s*\d/i.test(line));
  const presentSkills = skills.filter(skill => matches(text, skill));
  const requiredSkills = jd ? skills.filter(skill => matches(jd, skill)) : [];
  const genericTerms = [...new Set((jd.match(/[a-z][a-z-]{3,}/g) || []).filter(term => !stop.has(term) && !skills.some(skill => matches(term, skill))))].slice(0, 60);
  const keywords = [...requiredSkills, ...genericTerms];
  const matchedKeywords = jd ? keywords.filter(term => matches(text, term)) : presentSkills;
  const missingKeywords = jd ? keywords.filter(term => !matches(text, term)) : [];
  const keywordMatch = jd ? percent(matchedKeywords.length, keywords.length) : null;
  const skillsMatch = jd ? percent(requiredSkills.filter(skill => matches(text, skill)).length, requiredSkills.length) : null;
  const contentQuality = Math.min(100, (sections.experience || sections.projects ? 30 : 0) + (dates ? 15 : 0) + Math.min(30, actionLines.length * 10) + Math.min(25, impactLines.length * 12.5));
  const yearRequirement = jd.match(/\b(\d{1,2})\+?\s+years?\b/);
  const declaredYears = [...text.matchAll(/\b(\d{1,2})\+?\s+years?\b/g)].map(match => Number(match[1]));
  const experienceMatch = yearRequirement && declaredYears.length ? Math.round(Math.min(1, Math.max(...declaredYears) / Number(yearRequirement[1])) * 100) : null;
  const formatting = Math.round((email ? 15 : 0) + (phone ? 10 : 0) + (sections.education ? 15 : 0) + (sections.skills ? 15 : 0) + (sections.experience || sections.projects ? 20 : 0) + (words.length >= 150 && words.length <= 1200 ? 15 : 5) + (!pages || pages <= 2 ? 10 : 0));
  const weights = jd ? { keywordMatch: 35, skillsMatch: 25, experienceMatch: 10, contentQuality: 15, formatting: 15 } : { contentQuality: 55, formatting: 45 };
  const metrics = { keywordMatch, skillsMatch, experienceMatch, contentQuality: Math.round(contentQuality), formatting };
  const usable = Object.entries(weights).filter(([key]) => metrics[key] !== null);
  const score = Math.round(usable.reduce((sum, [key, weight]) => sum + metrics[key] * weight, 0) / usable.reduce((sum, [, weight]) => sum + weight, 0));
  const strengths = [], issues = [], suggestions = [];
  function check(ok, strength, issue, section, current, suggested) {
    if (ok) strengths.push(strength);
    else { issues.push(issue); suggestions.push({ id: suggestions.length + 1, section, title: issue, current, suggested }); }
  }
  check(email && phone, 'Email and phone are readable.', 'Add readable contact details.', 'Contact', lines.find(line => line.includes('@')) || 'Email or phone not detected.', 'Include your real email address and phone number as plain text.');
  check(sections.skills, 'A recognizable skills section is present.', 'Add a clearly labeled Skills section.', 'Skills', 'Skills heading not detected.', 'List skills you actually possess under a Skills heading.');
  check(sections.experience || sections.projects, 'Experience or projects are clearly identified.', 'Include experience or relevant projects.', 'Experience', 'Experience/project heading not detected.', 'Describe your actual roles or projects under standard headings.');
  check(impactLines.length >= 2, 'Several achievements include measurable results.', 'Show measurable results in your accomplishments.', 'Experience', actionLines[0] || 'No action-led achievement detected.', 'Describe what you did, how you did it, and a verifiable result. Add numbers only when accurate.');
  check(sections.education, 'Education is easy to identify.', 'Use a standard Education heading.', 'Education', 'Education heading not detected.', 'Include your actual qualification, institution and dates.');
  if (missingKeywords.length) { issues.push('Job-description terms are missing.'); suggestions.push({ id: suggestions.length + 1, section: 'Job relevance', title: 'Review missing job requirements', current: missingKeywords.join(', '), suggested: 'Mention these requirements only where supported by your real skills and experience; do not add skills you lack.' }); }
  if (words.length < 150 || words.length > 1200) issues.push(`Resume contains ${words.length} words; review whether it is too brief or too long.`);
  if (pages > 2) issues.push(`Resume has ${pages} pages; consider whether all content is relevant.`);
  return { score, matchLabel: score >= 80 ? 'Strong' : score >= 60 ? 'Needs some improvement' : 'Needs improvement', ...metrics, matchedKeywords, missingKeywords, strengths, issues, suggestions, weights: Object.fromEntries(usable.map(([key, weight]) => [key, Math.round(weight / usable.reduce((sum, [, w]) => sum + w, 0) * 100)])), summary: `${jd ? 'Job-specific match estimate' : 'General resume readiness estimate'}. Based on readable text, section structure and achievement evidence. Formatting measures text readability, not visual layout. Employer ATS rules differ; this is not a hiring prediction.${!jd ? ' Add a job description to measure keyword and skills matching.' : ''}`, wordCount: words.length, pages, source, methodologyVersion: 1 };
}

export async function analyzeRequest(request) {
  if ((request.headers.get('content-type') || '').includes('application/json')) {
    const data = await readJson(request);
    return analyzeResume(data.resumeText, data.jobDescription);
  }
  requireCondition((request.headers.get('content-type') || '').includes('multipart/form-data'), 415, 'Upload a PDF, DOCX or TXT resume.');
  requireCondition(Number(request.headers.get('content-length') || 0) <= 11 * 1024 * 1024, 413, 'Resume must be at most 10 MB.');
  const form = await request.formData();
  const file = form.get('resume');
  requireCondition(file && typeof file.arrayBuffer === 'function' && file.size > 0 && file.size <= 10 * 1024 * 1024, 400, 'Select a nonempty resume no larger than 10 MB.');
  const bytes = Buffer.from(await file.arrayBuffer());
  const extension = file.name.toLowerCase().split('.').pop();
  let text, pages = null;
  if (extension === 'pdf') {
    requireCondition(bytes.subarray(0, 5).toString() === '%PDF-', 400, 'Invalid PDF file.');
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const task = getDocument({ data: new Uint8Array(bytes), useSystemFonts: true, isEvalSupported: false });
    let document;
    try {
      document = await task.promise;
      pages = document.numPages;
      requireCondition(pages <= 10, 400, 'Upload a resume with at most 10 pages.');
      const parts = [];
      for (let page = 1; page <= pages; page++) {
        const content = await (await document.getPage(page)).getTextContent();
        parts.push(content.items.map(item => item.str + (item.hasEOL ? '\n' : ' ')).join(''));
      }
      text = parts.join('\n');
    } finally { await task.destroy(); }
  } else if (extension === 'docx') {
    requireCondition(bytes.subarray(0, 2).toString() === 'PK', 400, 'Invalid DOCX file.');
    const mammoth = await import('mammoth');
    text = (await mammoth.extractRawText({ buffer: bytes })).value;
  } else if (extension === 'txt') text = bytes.toString('utf8');
  else requireCondition(false, 415, 'Use PDF, DOCX or TXT. Convert legacy DOC files to DOCX first.');
  return analyzeResume(text, form.get('jobDescription') || '', { pages, source: extension });
}
