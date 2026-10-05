import apiClient from './apiClient';
import { getAuthClient } from './authService';
import { hasResumeFacts } from './documentResume';

const extractions = new Map();
async function ownerId() {
  const client = await getAuthClient();
  const { data, error } = await client.auth.getSession();
  if (error) throw error;
  if (!data.session?.user?.id) throw new Error('Please sign in to use your documents.');
  return data.session.user.id;
}
const text = value => typeof value === 'string' ? value.trim() : '';
export function normalizeExtraction(result) {
  const structured = result.structured_data || {};
  if (result.resume_data || structured.resume_data) {
    const data = result.resume_data || structured.resume_data;
    const summary = text(data.summary) || text(result.resume_summary);
    return { ...result, resume_data: { ...data, ...(summary ? { summary } : {}) } };
  }
  // Compatibility with older upload responses that contain document-specific fields.
  const personal = { ...(structured.personal || structured.personal_info || {}) };
  const candidate = structured.recipient || structured.candidate || structured.student || {};
  const name = text(structured.recipient_name) || text(structured.candidate_name) || text(structured.student_name) || text(structured.participant_name) || text(candidate.name) || text(candidate.full_name) || text(structured.full_name) || text(structured.recipient);
  if (name && !personal.name) personal.name = name;
  const title = text(structured.certificate_title) || text(structured.certificate_name) || text(structured.course_name) || text(structured.title);
  const issuer = text(structured.issuer) || text(structured.organization);
  const achievements = Array.isArray(structured.achievements) ? structured.achievements : title ? [issuer ? `${title} — ${issuer}` : title] : [];
  return { ...result, resume_data: { personal, achievements,
    skills: Array.isArray(structured.skills) ? structured.skills : [],
    education: Array.isArray(structured.education) ? structured.education : [],
    experience: Array.isArray(structured.experience) ? structured.experience : [],
    projects: Array.isArray(structured.projects) ? structured.projects : [],
    summary: text(structured.summary) || text(result.resume_summary),
  } };
}

export async function uploadDocuments(files) {
  const selected = Array.from(files || []);
  if (!selected.length || selected.length > 5) throw new Error('Select between 1 and 5 documents.');
  if (selected.some(file => file.size > 10 * 1024 * 1024)) throw new Error('Each document must be no larger than 10 MB.');
  const owner = await ownerId();
  const form = new FormData(); selected.forEach(file => form.append('files', file));
  const response = await apiClient.post('/upload', form);
  const processed = (response.results || []).filter(item => item.success).map(normalizeExtraction);
  let listing;
  try { listing = await apiClient.get('/documents'); }
  catch (error) {
    const saved = processed.map(item => item.document).filter(Boolean);
    if (saved.length !== processed.length || !saved.length) throw error;
    listing = { documents: saved };
  }
  if (await ownerId() !== owner) throw new Error('Your account changed during the upload. Open your vault to continue.');
  const documents = listing.documents.map(document => {
    const extraction = processed.find(item => item.storage_path === document.file_path);
    if (!extraction) return document;
    extractions.set(`${owner}/${document.id}`, extraction);
    return { ...document, ...extraction, id: document.id, file_name: document.file_name };
  });
  const uploaded = documents.filter(document => processed.some(item => item.storage_path === document.file_path));
  for (const extraction of processed) {
    if (extraction.document && !uploaded.some(document => document.id === extraction.document.id)) {
      const document = { ...extraction.document, ...extraction, id: extraction.document.id, file_name: extraction.document.file_name };
      extractions.set(`${owner}/${document.id}`, extraction); documents.unshift(document); uploaded.push(document);
    }
  }
  if (processed.length && uploaded.length !== processed.length) throw new Error('The upload was saved but could not be located in the vault. Refresh the vault and try again.');
  return { documents, uploaded,
    failures: (response.results || []).filter(item => !item.success) };
}

export async function getDocumentForResume(document) {
  if (!document.id) throw new Error('This upload is not available in the vault yet. Reopen the vault and try again.');
  const owner = await ownerId();
  if (document.user_id && document.user_id !== owner) throw new Error('This document could not be found in your account. Refresh the vault and try again.');
  const key = `${owner}/${document.id}`;
  let extraction = document.resume_data && (!document.user_id || document.user_id === owner) ? normalizeExtraction(document) : extractions.get(key);
  if (!extraction || !hasResumeFacts(extraction.resume_data)) {
    try { extraction = normalizeExtraction(await apiClient.post(`/documents/${document.id}/extraction`)); }
    catch (error) {
      if (error.status === 404 && error.detail === 'Not Found') throw new Error('The running backend needs an update. Restart the backend from /games/ai_resume_builder, then try again.', { cause: error });
      if (error.status === 404) throw new Error('This document could not be found in your account. Refresh the vault and try again.', { cause: error });
      throw error;
    }
  }
  if (!hasResumeFacts(extraction.resume_data)) throw new Error('No resume information could be read. Try a clearer certificate or document.');
  if (await ownerId() !== owner) throw new Error('Your account changed while reading the document. Please try again.');
  extractions.set(key, extraction);
  return { ...document, ...extraction, id: document.id, file_name: document.file_name };
}

export async function combineDocumentsForResume(documents) {
  if (documents.length < 2 || documents.length > 5) throw new Error('Select between 2 and 5 certificates to combine.');
  const ids = documents.map(document => document.id);
  if (new Set(ids).size !== ids.length || ids.some(id => !id)) throw new Error('Select different saved documents to combine.');
  const owner = await ownerId();
  if (documents.some(document => document.user_id && document.user_id !== owner)) throw new Error('Select documents from your own vault.');
  let result;
  try { result = await apiClient.post('/documents/combine', { document_ids: ids }); }
  catch (error) {
    if (error.status === 404 && error.detail === 'Not Found') throw new Error('Restart the backend from /games/ai_resume_builder to enable combined certificate summaries.', { cause: error });
    throw error;
  }
  if (await ownerId() !== owner) throw new Error('Your account changed while combining documents. Please try again.');
  return normalizeExtraction(result);
}
