const keyFor = userId => `resumate.resumes.${userId}`;
export function listSavedResumes(userId) {
  if (!userId) return [];
  try {
    const value = JSON.parse(localStorage.getItem(keyFor(userId)) || '[]');
    return Array.isArray(value) ? value.filter(item => item.id && item.resume?.personal && Array.isArray(item.resume.achievements)) : [];
  } catch { return []; }
}
export function saveResume(userId, resume, template, existingId) {
  if (!userId) throw new Error('Sign in to save your resume.');
  const entry = { id: existingId || crypto.randomUUID(), title: resume.personal.name ? `${resume.personal.name}’s Resume` : 'Untitled Resume',
    template, resume: JSON.parse(JSON.stringify(resume)), updated_at: new Date().toISOString() };
  const entries = [entry, ...listSavedResumes(userId).filter(item => item.id !== entry.id)];
  localStorage.setItem(keyFor(userId), JSON.stringify(entries));
  return { entry, entries };
}
