const headings = {
  experience: '(?:(?:professional|work|relevant)\\s+)?experience|employment(?: history)?|work history|internships?',
  projects: '(?:(?:personal|academic|selected|relevant)\\s+)?projects?',
  education: 'education(?:al background)?|academic(?: background| qualifications)?|qualifications',
  skills: '(?:(?:technical|professional|core|key)\\s+)?skills|competencies|technical expertise',
  summary: '(?:(?:professional|career)\\s+)?summary|profile|(?:career )?objective',
};

export function inspectResume(text) {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const sections = Object.fromEntries(Object.entries(headings).map(([key, pattern]) => [key,
    lines.some(line => new RegExp(`^(?:[•*#\\d.()\\s-]*)(${pattern})\\s*(?::|[|–—-]|$)`, 'i').test(line))]));
  const sectionCount = Object.values(sections).filter(Boolean).length;
  const contact = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|linkedin\.com\/in\/|(?:\+?\d[\d ().-]{7,}\d)/i.test(text);
  const careerEvidence = /\b(bachelor|master|degree|diploma|university|college|school|intern|engineer|developer|manager|analyst|assistant|coordinator|designer|specialist|nurse|teacher|technician|accountant|worked|built|developed|managed|led|created|designed|implemented|delivered|supported)\b/i.test(text);
  // Reject documents that identify themselves as certificates, invoices, etc.
  // Check the opening, so a resume's later certifications section stays valid.
  const opening = lines.slice(0, 6).join('\n');
  const otherDocument = /(?:^|\n)\s*(?:tax )?invoice\b|\b(certificate of (?:completion|achievement|participation)|this (?:is to certify|certifies)|statement of marks|academic transcript|purchase order|payment receipt|job description|ingredients|abstract)\b/i.test(opening);
  const accepted = !otherDocument && careerEvidence && (sections.education || sections.experience || sections.projects) && sectionCount >= 2 && (contact || sectionCount >= 3);
  return { accepted, sections, sectionCount, contact, reason: accepted ? '' : 'This document could not be identified as a resume. Upload your CV with clearly labeled Education, Experience or Projects, and Skills sections. Certificates, invoices, job descriptions and other documents are not accepted.' };
}
