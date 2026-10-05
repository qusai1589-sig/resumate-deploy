export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function requireCondition(condition, status, message) {
  if (!condition) throw new ApiError(status, message);
}

export async function readJson(request) {
  requireCondition((request.headers.get('content-type') || '').includes('application/json'), 415, 'Send a JSON request.');
  const chunks = [];
  let length = 0;
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(400, 'Request body is required.');
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > 64 * 1024) {
      await reader.cancel();
      throw new ApiError(413, 'Request is too large.');
    }
    chunks.push(Buffer.from(value));
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    requireCondition(data && typeof data === 'object' && !Array.isArray(data), 400, 'Invalid request.');
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'Invalid JSON request.');
  }
}
