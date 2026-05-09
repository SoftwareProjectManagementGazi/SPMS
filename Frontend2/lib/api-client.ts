import axios from 'axios';
import { AUTH_TOKEN_KEY, SESSION_EXPIRED_KEY } from '@/lib/constants';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// REQUEST interceptor — attach Bearer token from localStorage (D-02)
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      if (token) {
        // D-02 quoted-token guard: localStorage may store JSON-stringified strings
        const cleanToken = token.startsWith('"') ? JSON.parse(token) : token;
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error.message);
    return Promise.reject(error);
  }
);

// RESPONSE interceptor — 401 → session-expired (D-03: clear both storages)
// FL-05 fix (Phase 10 review): extend the auth-free exemption list so a
// background 401 (stale cache refetch, for example) fired while the user
// sits on /forgot-password does not bounce them to /session-expired. Also
// tighten URL matching — substring match on '/auth/login' would match any
// path containing that sequence. Use endsWith() for stability and explicit
// allow-listing for auth entry-point URLs.
const AUTH_FREE_PATHS = ['/login', '/session-expired', '/forgot-password'];
const AUTH_FREE_URL_SUFFIXES = ['/auth/login', '/auth/password-reset'];

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? '';

    // Determine auth-free context once so both the redirect guard and the
    // log-suppression check below can reference it without re-computing.
    let onAuthFreePath = false;
    if (status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      onAuthFreePath = AUTH_FREE_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
      );
      const isAuthFreeUrl = AUTH_FREE_URL_SUFFIXES.some((u) =>
        requestUrl.endsWith(u)
      );

      if (!onAuthFreePath && !isAuthFreeUrl) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        // FL-02 fix (Phase 10 review): use exported constant so a future rename
        // of SESSION_EXPIRED_KEY cannot silently diverge between writer and reader.
        localStorage.setItem(SESSION_EXPIRED_KEY, 'true');
        // D-03: also clear the presence cookie that Next.js middleware reads
        document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        window.location.href = '/session-expired';
      }
    }

    // Phase 12 Plan 12-10 (Bug Z UAT fix) — silence the global console.error
    // for status codes that callers have explicitly opted into via
    // `config.expectedFailureCodes`. The ActivityFeed widget on /dashboard
    // taps GET /activity which is admin-only (Phase 10 BL-01); non-admin
    // users predictably get 403 and useGlobalActivity already swallows the
    // error to render an empty feed. Pre-fix the interceptor still logged
    // `API Error: Object` to the console for every 403, polluting the
    // console for any non-admin user opening the dashboard. The opt-in
    // model keeps the noisy default for surprises (real bugs) while letting
    // known-benign expected failures stay quiet.
    //
    // Session-init probe: AuthProvider calls /auth/me on mount to validate a
    // token that may have expired since the last session. A 401 here on an
    // auth-free page (/login, /session-expired, etc.) is fully expected —
    // the catch block in auth-context.tsx already handles it by clearing the
    // stale token. Logging it as an error is misleading noise.
    const expectedCodes: number[] | undefined =
      error.config?.expectedFailureCodes;
    const isSessionProbe401 =
      status === 401 && requestUrl.endsWith('/auth/me') && onAuthFreePath;
    const isExpected =
      isSessionProbe401 ||
      (Array.isArray(expectedCodes) &&
        typeof status === 'number' &&
        expectedCodes.includes(status));

    // Callers can pass `silentFailure: true` in the axios request config to
    // suppress the global console.error for endpoints that are known to be
    // optional or not yet implemented on the backend (e.g. /teams/:id/activity).
    const isSilent = (error.config as any)?.silentFailure === true;

    if (!isExpected && !isSilent) {
      console.error('API Error:', error.response?.data || error.message);
    }
    return Promise.reject(error);
  }
);
