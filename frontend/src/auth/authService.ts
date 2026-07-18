import { apiClient, authApi } from './apiClient';

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: 'CITIZEN' | 'OFFICER' | 'ADMIN';
  department?: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export const authService = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const response = await authApi.post('/auth/login', credentials);
    const { access_token, refresh_token, user } = response.data;
    localStorage.setItem('access_token', access_token);
    localStorage.setItem('refresh_token', refresh_token);
    localStorage.setItem('user', JSON.stringify(user));
    return response.data;
  },

  register: async (userData: any): Promise<any> => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await authApi.post('/auth/logout');
    } catch {
    }
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    document.cookie = "refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure";
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  setTokens: (accessToken: string, refreshToken: string, user: User) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  },

  getLocalUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  forgotPassword: async (email: string): Promise<any> => {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (token: string, newPassword: string): Promise<any> => {
    const response = await apiClient.post('/auth/reset-password', { token, new_password: newPassword });
    return response.data;
  }
};
