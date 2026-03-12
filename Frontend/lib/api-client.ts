import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const SESSION_EXPIRED_KEY = 'session_expired';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR — attach Bearer token before every request
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);

      if (token) {
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

// 2. RESPONSE INTERCEPTOR — handle 401 globally (SAFE-02)
// On any 401 that is NOT from the /auth/login endpoint:
//   • store session_expired flag so the login page can display a message
//   • redirect to /login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !window.location.pathname.includes('/login') &&
      !error.config?.url?.includes('/auth/login')
    ) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.setItem(SESSION_EXPIRED_KEY, 'true');
      window.location.href = '/login';
    }

    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
