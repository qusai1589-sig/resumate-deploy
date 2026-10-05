import { ApiError } from './errors.mjs';

export const MAPPING_VERSION = 3;
export const text = value => typeof value === 'string' ? value.trim().slice(0, 12000) : typeof value === 'number' && Number.isFinite(value) ? String(value) : '';
const personalFields = ['name', 'title', 'email', 'phone', 'location', 'linkedin', 'github', 'website'];
const sectionFields = { education: ['degree', 'institution', 'year', 'details'], experience: ['role', 'company', 'duration', 'description'], projects: ['name', 'technologies', 'description', 'link'] };
const array = value => Array.isArray(value) ? value.slice(0, 100) : [];
const unique = items => {
  const seen = new Set();
  return items.filter(item => {
    const key = typeof item === 'string' ? item.toLocaleLowerCase() : JSON.stringify(item).toLocaleLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function normalizeResumeData(structured = {}) {
  const source = structured.resume_data || structured;
  const result = { personal: {}, summary: text(source.summary), education: [], experience: [], projects: [], skills: [], achievements: [] };
  for (const key of personalFields) result.personal[key] = text(source.personal?.[key]);
  result.personal.name ||= text(structured.recipient_name || structured.student_name || structured.candidate_name);
  for (const [section, fields] of Object.entries(sectionFields)) {
    result[section] = unique(array(source[section]).filter(item => item && typeof item === 'object' && !Array.isArray(item)).map(item => {
      const entry = Object.fromEntries(fields.map(field => [field, text(item[field])]));
      if (section === 'education') {
        const extras = [];
        for (const [key, label] of [['cgpa', 'CGPA'], ['gpa', 'GPA'], ['percentage', 'Percentage'], ['overall_grade', 'Overall grade'], ['total_marks', 'Total marks']]) {
          const value = text(item[key]);
          if (value && !entry.details.toLowerCase().includes(`${label}: ${value}`.toLowerCase())) extras.push(`${label}: ${value}${key === 'percentage' && !value.endsWith('%') ? '%' : ''}`);
        }
        const obtained = Number(item.total_marks_obtained);
        const maximum = Number(item.maximum_total_marks);
        if (!text(item.percentage) && text(item.total_marks_obtained) && text(item.maximum_total_marks) && Number.isFinite(obtained) && maximum > 0 && obtained >= 0 && obtained <= maximum) {
          extras.push(`Total marks: ${obtained}/${maximum}`, `Percentage (calculated): ${Math.round(obtained / maximum * 10000) / 100}%`);
        }
        entry.details = [entry.details, ...extras].filter(Boolean).join('; ');
      }
      return entry;
    }).filter(item => Object.values(item).some(Boolean)));
  }
  for (const section of ['skills', 'achievements']) result[section] = unique(array(source[section]).map(value => typeof value === 'string' ? text(value) : '').filter(Boolean));
  return result;
}

export function hasFacts(data) {
  return Object.values(data.personal).some(Boolean) || ['education', 'experience', 'projects', 'skills', 'achievements'].some(key => data[key].length);
}

export function combineResumeData(profiles) {
  const normalized = profiles.map(normalizeResumeData);
  const names = new Set(normalized.map(item => item.personal.name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()).filter(Boolean));
  if (names.size > 1) throw new ApiError(409, 'These documents contain different candidate names. Select documents for the same person.');
  const result = normalizeResumeData();
  for (const profile of normalized) {
    for (const key of personalFields) result.personal[key] ||= profile.personal[key];
    for (const key of [...Object.keys(sectionFields), 'skills', 'achievements']) result[key] = unique([...result[key], ...profile[key]]);
  }
  return result;
}
