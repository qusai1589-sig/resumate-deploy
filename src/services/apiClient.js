import { getAuthClient } from './authService';
const API_BASE_URL = '/api';
class ApiClient {
  async request(endpoint, { method = 'GET', body, blob = false } = {}) {
    const client = await getAuthClient();
    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    if (!data.session) throw new Error('Please sign in to access your documents.');
    const headers = { Authorization: `Bearer ${data.session.access_token}` };
    if (body && !(body instanceof FormData)) headers['Content-Type'] = 'application/json';
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { method, headers, body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined });
    if (!response.ok) {
      const detail = await response.json().catch(() => ({}));
      const error = new Error(typeof detail.detail === 'string' ? detail.detail : `Request failed (${response.status})`);
      error.status = response.status; error.detail = detail.detail;
      throw error;
    }
    if (!blob) return response.json();
    if ((response.headers.get('Content-Type') || '').includes('application/json')) {
      const { url } = await response.json();
      const file = await fetch(url);
      if (!file.ok) throw new Error('Download expired or unavailable. Please try again.');
      return file.blob();
    }
    return response.blob();
  }
  get(endpoint, params = {}) { return this.request(endpoint + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : '')); }
  post(endpoint, body) {
    if (endpoint === '/upload' && body instanceof FormData) return this.uploadFiles(body.getAll('files'));
    return this.request(endpoint, { method: 'POST', body });
  }
  async uploadFiles(files) {
    const prepared = await this.request('/upload/prepare', { method: 'POST', body: {
      files: files.map(file => ({ file_name: file.name, file_size_bytes: file.size, mime_type: file.type })),
    } });
    const results = [];
    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const ticket = prepared.files[index];
      let stored = false;
      try {
        const client = await getAuthClient();
        const { data, error } = await client.auth.getSession();
        if (error) throw error;
        if (!data.session || data.session.user.id !== prepared.user_id) throw new Error('Your account changed during the upload. Please try again.');
        const uploaded = await fetch(ticket.upload_url, {
          method: 'POST',
          headers: { apikey: prepared.anon_key, Authorization: `Bearer ${data.session.access_token}`, 'Content-Type': ticket.mime_type },
          body: file,
        });
        if (!uploaded.ok) throw new Error('Private storage upload failed. Please try again.');
        stored = true;
        const response = await this.request('/upload', { method: 'POST', body: { files: [{ ticket: ticket.ticket }] } });
        results.push(...response.results);
      } catch (error) {
        // Do not delete an object after an uncertain finalize response: the API
        // may already have saved its document record. It can be retried safely.
        results.push({ success: false, filename: file.name, error: stored ? `${error.message} Open your vault to check whether it was saved.` : error.message });
      }
    }
    const successful = results.filter(item => item.success).length;
    return { success: successful > 0, results, total_files: results.length, successful_files: successful, failed_files: results.length - successful };
  }
  mockDelay(ms = 400) { return new Promise(resolve => setTimeout(resolve, ms)); }
  async download(document) {
    const blob = await this.request(`/documents/${document.id}/file`, { blob: true });
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url; link.download = document.file_name; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
export const apiClient = new ApiClient();
export default apiClient;
