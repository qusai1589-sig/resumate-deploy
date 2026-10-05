const personalFields = ['name', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'website'];
const sections = { education: ['degree', 'institution', 'year', 'details'], experience: ['role', 'company', 'duration', 'description'], projects: ['name', 'technologies', 'description', 'link'] };
const cleanText = value => typeof value === 'string' ? value.trim() : '';
const unique = items => [...new Set(items)];

export function emptyResume() {
  return { personal: Object.fromEntries(personalFields.map(field => [field, ''])), summary: '', education: [], experience: [], projects: [], skills: [], achievements: [], customSections: [] };
}

export function templateResume() {
  return {
    personal: { name: 'Your Name', title: 'Computer Engineering Student', email: 'you@example.com', phone: '+91 98765 43210', location: 'Mumbai, India', linkedin: 'linkedin.com/in/yourname', github: 'github.com/yourname', website: '' },
    summary: 'Motivated Computer Engineering student with a strong interest in software development, artificial intelligence and problem solving. Passionate about building practical solutions and continuously learning new technologies.',
    education: [{ degree: 'B.E. Computer Engineering', institution: 'Your College Name', year: '2024 – 2028', details: 'CGPA: 9.50' }],
    experience: [{ role: 'Software Development Intern', company: 'Company Name', duration: 'Jun 2026 – Jul 2026', description: 'Worked on frontend development, implemented responsive interfaces and collaborated with the development team to build user-focused features.' }],
    projects: [{ name: 'AI Resume Builder', technologies: 'React • JavaScript • OCR • AI', description: 'Developed an AI-powered resume builder that extracts information from certificates and helps users create professional, ATS-friendly resumes.', link: '' }],
    skills: ['Java', 'Python', 'JavaScript', 'React', 'SQL', 'Git', 'Problem Solving', 'Communication'],
    achievements: ['Participated in Smart India Hackathon', 'Completed technical workshops and certifications'], customSections: [],
    _exampleSections: ['education', 'experience', 'projects', 'skills', 'achievements', 'summary'],
  };
}

export function applyDocumentToResume(current, document) {
  const fingerprint = JSON.stringify({ resume_data: document.resume_data, resume_summary: document.resume_summary });
  if (document.id && current._documentFacts?.[document.id] === fingerprint) return current;
  const data = document.resume_data || {};
  const examples = new Set(current._exampleSections || []);
  const next = { ...current, personal: { ...current.personal } };
  for (const key of personalFields) {
    const value = cleanText(data.personal?.[key]);
    if (value) next.personal[key] = value;
  }
  for (const [section, fields] of Object.entries(sections)) {
    const additions = (Array.isArray(data[section]) ? data[section] : []).filter(item => item && typeof item === 'object')
      .map(item => Object.fromEntries(fields.map(field => [field, cleanText(item[field])])))
      .filter(item => Object.values(item).some(Boolean));
    const merged = [...(additions.length && examples.has(section) ? [] : current[section] || [])];
    if (additions.length) examples.delete(section);
    for (const item of additions) if (!merged.some(existing => fields.every(field => cleanText(existing[field]) === item[field]))) merged.push(item);
    next[section] = merged;
  }
  for (const section of ['skills', 'achievements']) {
    const additions = (Array.isArray(data[section]) ? data[section] : []).map(cleanText).filter(Boolean);
    next[section] = unique([...(additions.length && examples.has(section) ? [] : current[section] || []), ...additions]);
    if (additions.length) examples.delete(section);
  }
  const summary = cleanText(data.summary) || cleanText(document.resume_summary);
  if (summary) { next.summary = summary; examples.delete('summary'); }
  // Never copy filenames, document IDs, or unsupported facts into the resume.
  next._appliedDocuments = unique([...(current._appliedDocuments || []), ...(document.id ? [document.id] : [])]);
  next._exampleSections = [...examples];
  next._documentFacts = { ...(current._documentFacts || {}), ...(document.id ? { [document.id]: fingerprint } : {}) };
  return next;
}

export function hasResumeFacts(data = {}) {
  return personalFields.some(key => cleanText(data.personal?.[key])) || cleanText(data.summary) ||
    ['education', 'experience', 'projects', 'skills', 'achievements'].some(key => Array.isArray(data[key]) && data[key].length > 0);
}
