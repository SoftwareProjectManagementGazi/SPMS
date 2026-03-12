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
    avatar?: string
    is_active: boolean
    role?: {
        name: string
        description?: string
    }
}

const mapUserResponseToUser = (data: UserResponseDTO): User => ({
    id: data.id.toString(),
    name: data.full_name,
    email: data.email,
    avatar: data.avatar || "/placeholder-user.jpg",
    // DİNAMİK ROL ATAMASI
    role: data.role ? { name: data.role.name } : { name: "Member" } // Güvenlik ağı: Backend rol dönmezse varsayılan
});

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
      const response = await apiClient.get<UserResponseDTO>('/auth/me');
      return mapUserResponseToUser(response.data);
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
  },

  updateProfile: async (data: {
    full_name?: string;
    email?: string;
    current_password?: string;
  }): Promise<User> => {
    const response = await apiClient.put<UserResponseDTO>('/auth/me', data);
    return mapUserResponseToUser(response.data);
  },

  uploadAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<UserResponseDTO>('/auth/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return mapUserResponseToUser(response.data);
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/request', { email });
  },

  confirmPasswordReset: async (token: string, newPassword: string): Promise<void> => {
    await apiClient.post('/auth/password-reset/confirm', {
      token,
      new_password: newPassword,
    });
  },
};
