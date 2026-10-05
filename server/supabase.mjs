import { ApiError, requireCondition } from './errors.mjs';

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function publicConfig(env) {
  const url = env.SUPABASE_URL?.replace(/\/$/, '');
  const anon_key = env.SUPABASE_ANON_KEY;
  requireCondition(url && anon_key, 503, 'Configure SUPABASE_URL and SUPABASE_ANON_KEY in this deployment.');
  // A service key must never reach /auth/config or the browser upload client.
  let role;
  try { role = JSON.parse(Buffer.from(anon_key.split('.')[1], 'base64url')).role; } catch { /* New publishable keys are not JWTs. */ }
  requireCondition((!role || role === 'anon') && !anon_key.startsWith('sb_secret_'), 503, 'SUPABASE_ANON_KEY must be a public anon or publishable key.');
  return { url, anon_key };
}

export function createSupabase(env, fetcher) {
  const config = publicConfig(env);
  async function request(path, { token, headers, timeout = 30000, ...options } = {}) {
    try {
      return await fetcher(`${config.url}${path}`, {
        ...options,
        headers: { apikey: config.anon_key, Authorization: `Bearer ${token || config.anon_key}`, ...headers },
        cache: 'no-store',
        signal: AbortSignal.timeout(timeout),
      });
    } catch {
      throw new ApiError(503, 'Supabase is unavailable. Please try again.');
    }
  }
  async function user(requestObject) {
    const authorization = requestObject.headers.get('authorization') || '';
    requireCondition(/^Bearer \S+$/i.test(authorization), 401, 'Login required');
    const token = authorization.slice(7);
    const response = await request('/auth/v1/user', { token });
    if (!response.ok) throw new ApiError(response.status >= 500 ? 503 : 401, 'Please sign in again.');
    const data = await response.json();
    requireCondition(data && UUID.test(data.id), 401, 'Please sign in again.');
    return { id: data.id, token };
  }
  async function documents(owner, params) {
    const response = await request(`/rest/v1/documents?${new URLSearchParams(params)}`, { token: owner.token });
    requireCondition(response.ok, 502, 'Document lookup failed.');
    const rows = await response.json();
    requireCondition(Array.isArray(rows), 502, 'Document lookup failed.');
    return rows;
  }
  async function ownedDocument(id, owner) {
    requireCondition(UUID.test(id), 400, 'Invalid document ID.');
    const rows = await documents(owner, { select: '*', id: `eq.${id}`, user_id: `eq.${owner.id}`, limit: '1' });
    const row = rows[0];
    requireCondition(row && row.user_id === owner.id && typeof row.file_path === 'string' && row.file_path.startsWith(`${owner.id}/`) && !row.file_path.split('/').some(part => part === '..' || part === '.'), 404, 'Document not found');
    return row;
  }
  return { config, request, user, documents, ownedDocument };
}

export function objectPath(path, authenticated = false) {
  return `/storage/v1/object/${authenticated ? 'authenticated/' : ''}uploads/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export async function boundedBytes(response, limit = MAX_FILE_BYTES) {
  if (Number(response.headers.get('content-length')) > limit) {
    await response.body?.cancel();
    throw new ApiError(400, 'Document exceeds the size limit.');
  }
  const chunks = [];
  let size = 0;
  const reader = response.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new ApiError(400, 'Document exceeds the size limit.');
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

export function detectFileType(name, bytes) {
  const extension = name.toLowerCase().split('.').pop();
  if (extension === 'pdf' && bytes.subarray(0, 5).toString() === '%PDF-') return { extension: 'pdf', mime: 'application/pdf' };
  if (extension === 'png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { extension: 'png', mime: 'image/png' };
  if (['jpg', 'jpeg'].includes(extension) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { extension, mime: 'image/jpeg' };
  if (extension === 'webp' && bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return { extension, mime: 'image/webp' };
  throw new ApiError(400, 'Only valid PDF, PNG, JPG, JPEG, and WebP files are allowed.');
}
