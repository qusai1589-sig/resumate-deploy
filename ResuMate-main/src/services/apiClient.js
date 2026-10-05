import { getAuthClient } from './authService';
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
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
    return blob ? response.blob() : response.json();
  }
  get(endpoint, params = {}) { return this.request(endpoint + (Object.keys(params).length ? `?${new URLSearchParams(params)}` : '')); }
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); }
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
