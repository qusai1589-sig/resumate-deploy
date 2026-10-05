import { createServer } from 'node:http';
import { once } from 'node:events';
import { createHandler } from './api.mjs';
import { ApiError } from './errors.mjs';
import { MAX_FILE_BYTES } from './supabase.mjs';

export const MAX_MULTIPART_BYTES = 5 * MAX_FILE_BYTES + 1024 * 1024;

function corsHeaders(origin, env) {
  const allowed = (env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000').split(',').map(value => value.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Expose-Headers': 'Content-Disposition',
  };
}

async function readBody(incoming) {
  const multipart = (incoming.headers['content-type'] || '').startsWith('multipart/form-data');
  const limit = multipart ? MAX_MULTIPART_BYTES : 64 * 1024;
  if (Number(incoming.headers['content-length']) > limit) throw new ApiError(413, 'Request is too large. Upload at most five documents of 10 MB each.');
  const chunks = [];
  let length = 0;
  for await (const chunk of incoming) {
    length += chunk.length;
    if (length > limit) throw new ApiError(413, 'Request is too large.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

export function createNodeListener({ env = process.env, fetcher = globalThis.fetch, handler } = {}) {
  const signupRedirectUrl = (env.FRONTEND_ORIGINS || 'http://localhost:5173').split(',')[0].trim();
  const api = handler || createHandler({ env, fetcher, runtimeName: 'Node.js', downloadMode: 'binary', allowMultipart: true, signupRedirectUrl });
  return async (incoming, outgoing) => {
    const cors = corsHeaders(incoming.headers.origin, env);
    try {
      if (incoming.method === 'OPTIONS') {
        outgoing.writeHead(cors['Access-Control-Allow-Origin'] ? 204 : 403, { ...cors, 'Cache-Control': 'no-store' });
        outgoing.end();
        return;
      }
      const body = ['GET', 'HEAD'].includes(incoming.method) ? undefined : await readBody(incoming);
      // The authority is configured locally; never use an untrusted Host header
      // as an authentication email redirect target.
      const origin = env.PUBLIC_API_ORIGIN || 'http://localhost:8000';
      const path = new URL(incoming.url, 'http://localhost').pathname + new URL(incoming.url, 'http://localhost').search;
      const request = new Request(new URL(path, origin), { method: incoming.method === 'HEAD' ? 'GET' : incoming.method, headers: incoming.headers, ...(body ? { body } : {}) });
      const response = await api(request);
      outgoing.writeHead(response.status, { ...Object.fromEntries(response.headers), ...cors });
      if (!response.body || incoming.method === 'HEAD') { outgoing.end(); return; }
      const reader = response.body.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (outgoing.destroyed) { await reader.cancel(); return; }
          if (!outgoing.write(Buffer.from(value))) await once(outgoing, 'drain');
        }
      } finally { reader.releaseLock(); }
      outgoing.end();
    } catch (error) {
      if (outgoing.headersSent) { outgoing.destroy(); return; }
      outgoing.writeHead(error instanceof ApiError ? error.status : 500, { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store', ...cors });
      outgoing.end(JSON.stringify({ detail: error instanceof ApiError ? error.message : 'Request failed. Please try again.' }));
    }
  };
}

export function createBackendServer(options = {}) {
  const server = createServer(createNodeListener(options));
  server.requestTimeout = 360000;
  server.headersTimeout = 60000;
  return server;
}
