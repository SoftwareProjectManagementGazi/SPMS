import { apiClient } from '@/lib/api-client';
import { User } from '@/lib/types';
import { AUTH_TOKEN_KEY } from '@/lib/constants';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

interface UserResponseDTO {
    id: number
    email: string
    full_name: string
    is_active: boolean
    role?: {
        name: string
        description?: string
    }
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
      const response = await apiClient.get<UserResponseDTO>('/auth/me');
      const data = response.data;
      
      return {
          id: data.id.toString(),
          name: data.full_name,
          email: data.email,
          avatar: "/placeholder-user.jpg",
          // DİNAMİK ROL ATAMASI
          role: data.role ? { 
              name: data.role.name, 
              description: data.role.description 
          } : { name: "Member" } // Güvenlik ağı: Backend rol dönmezse varsayılan
      };
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  },

  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
  },

  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  },
  
  isAuthenticated: (): boolean => {
      const token = authService.getToken();
      return !!token;
  }
};
