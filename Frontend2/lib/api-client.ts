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
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      const onAuthFreePath = AUTH_FREE_PATHS.some(
        (p) => pathname === p || pathname.startsWith(p + '/')
      );
      const requestUrl = error.config?.url ?? '';
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
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
