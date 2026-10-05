const base = '/api';
const SESSION_KEY = 'resumate.auth.session';
const VERIFIER_KEY = 'resumate.auth.verifier';
let clientPromise;
let refreshPromise;
const listeners = new Set();
let session;
try { session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); } catch { session = null; }
function saveSession(next, event = 'SIGNED_IN') {
  session = next ? { ...next, expires_at: next.expires_at || Math.floor(Date.now() / 1000) + next.expires_in } : null;
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  listeners.forEach(callback => callback(event, session));
}
window.addEventListener('storage', event => {
  if (event.key !== SESSION_KEY) return;
  try { session = JSON.parse(event.newValue || 'null'); } catch { session = null; }
  listeners.forEach(callback => callback(session ? 'SIGNED_IN' : 'SIGNED_OUT', session));
});
function base64url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function getAuthClient() {
  if (!clientPromise) clientPromise = fetch(`${base}/auth/config`).then(async response => {
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Authentication configuration unavailable. Check the Next.js deployment settings.');
    }
    const config = await response.json();
    async function authRequest(path, body, token) {
      const response = await fetch(`${config.url}/auth/v1/${path}`, {
        method: 'POST', headers: { apikey: config.anon_key, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.msg || data.error_description || data.message || 'Authentication request failed');
        error.status = response.status; throw error;
      }
      return data;
    }
    async function getSession() {
      try {
        if (session && session.expires_at <= Date.now() / 1000 + 60) {
          if (!refreshPromise) refreshPromise = authRequest('token?grant_type=refresh_token', { refresh_token: session.refresh_token })
            .then(next => saveSession(next, 'TOKEN_REFRESHED')).catch(error => {
              if (error.status === 400 || error.status === 401) saveSession(null, 'SIGNED_OUT');
              throw error;
            }).finally(() => { refreshPromise = undefined; });
          await refreshPromise;
        }
        return { data: { session }, error: null };
      } catch (error) { return { data: { session: null }, error }; }
    }
    const callback = new URL(window.location.href);
    const code = callback.searchParams.get('code');
    const oauthError = callback.searchParams.get('error_description') || new URLSearchParams(callback.hash.slice(1)).get('error_description');
    if (code || oauthError) {
      callback.searchParams.delete('code'); callback.searchParams.delete('error'); callback.searchParams.delete('error_description'); callback.hash = '';
      window.history.replaceState(null, '', callback);
      if (oauthError) throw new Error(oauthError);
      const verifier = sessionStorage.getItem(VERIFIER_KEY);
      sessionStorage.removeItem(VERIFIER_KEY);
      if (!verifier) throw new Error('Google login expired. Please try again.');
      saveSession(await authRequest('token?grant_type=pkce', { auth_code: code, code_verifier: verifier }));
    }
    return { auth: {
      getSession,
      onAuthStateChange(callback) { listeners.add(callback); return { data: { subscription: { unsubscribe: () => listeners.delete(callback) } } }; },
      async setSession(next) { saveSession(next); return { data: { session }, error: null }; },
      async signOut() {
        const current = await getSession();
        try { if (current.data.session) await authRequest('logout', {}, current.data.session.access_token); }
        catch { /* Clear local access even if the remote logout is unavailable. */ }
        saveSession(null, 'SIGNED_OUT'); return { error: null };
      },
      async signInWithOAuth({ provider, options }) {
        try {
          const settingsResponse = await fetch(`${config.url}/auth/v1/settings`, { headers: { apikey: config.anon_key } });
          if (!settingsResponse.ok) throw new Error('Could not check Google login availability. Please try again.');
          const settings = await settingsResponse.json();
          if (settings.external?.[provider] !== true) throw new Error('Google sign-in is not enabled for this app yet. Please sign in with email and password.');
          const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
          const challenge = base64url(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))));
          sessionStorage.setItem(VERIFIER_KEY, verifier);
          const params = new URLSearchParams({ provider, redirect_to: options.redirectTo, code_challenge: challenge, code_challenge_method: 's256' });
          window.location.assign(`${config.url}/auth/v1/authorize?${params}`);
          return { error: null };
        } catch (error) { return { error }; }
      },
      async resetPasswordForEmail(email) {
        try { await authRequest('recover', { email }); return { error: null }; }
        catch (error) { return { error }; }
      },
    } };
  }).catch(error => { clientPromise = undefined; throw error; });
  return clientPromise;
}
export async function authenticate(mode, email, password, fullName = '') {
  const response = await fetch(`${base}/${mode === 'signin' ? 'login' : 'signup'}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password, ...(mode !== 'signin' && fullName.trim() ? { full_name: fullName.trim() } : {}) }),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.detail || 'Authentication failed');
  if (result.access_token && result.refresh_token) {
    const client = await getAuthClient();
    await client.auth.setSession(result);
    return true;
  }
  return false;
}
export async function googleLogin() {
  const client = await getAuthClient();
  const { error } = await client.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
  if (error) throw error;
}
