import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token to every request
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token süresi dolmuşsa veya geçersizse:
    if (error.response?.status === 401) {
       localStorage.removeItem(AUTH_TOKEN_KEY); // Token'ı sil
       window.location.href = '/login'; // Sayfayı yenileyerek Login'e at
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Burada ileride 401 (Unauthorized) hatalarını yakalayıp 
    // kullanıcıyı login sayfasına yönlendirebilirsiniz.
    if (error.response?.status === 401) {
       // Optional: clear token and redirect to login
       // localStorage.removeItem(AUTH_TOKEN_KEY);
       // window.location.href = '/login';
    }
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);
