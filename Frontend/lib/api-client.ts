import axios from 'axios';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 1. REQUEST INTERCEPTOR (İstek gönderilmeden önce çalışır)
// Token'ı localStorage'dan alıp header'a ekler.
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      
      if (token) {
        // Token'ı "Bearer <token>" formatında ekliyoruz
        // Tırnak işaretlerini temizlemek gerekebilir (eğer stringify ile kaydedildiyse)
        const cleanToken = token.startsWith('"') ? JSON.parse(token) : token;
        config.headers.Authorization = `Bearer ${cleanToken}`;
      }
    }
    return config;
  },
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

// 2. RESPONSE INTERCEPTOR (Yanıt geldikten sonra çalışır)
// Hataları global olarak yakalar.
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Token süresi dolmuşsa veya geçersizse (401 hatası):
    if (error.response?.status === 401) {
       // Sonsuz döngüye girmemesi için sadece login sayfasında değilsek yönlendir
       if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
           localStorage.removeItem(AUTH_TOKEN_KEY); // Token'ı sil
           window.location.href = '/login'; // Login'e at
       }
    }
    
    // Hata detayını konsola yaz (Debug için)
    console.error('API Error:', error.response?.data || error.message);
    
    return Promise.reject(error);
  }
);