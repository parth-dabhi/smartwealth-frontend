import { apiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';
import { unwrapApiResponse } from './unwrap';
import { AUTH_STORAGE_KEYS } from '@/constants/auth';

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials);
    return unwrapApiResponse<AuthResponse>(response.data);
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await apiClient.post('/users', userData);
    return unwrapApiResponse<User>(response.data);
  },

  refreshToken: async (refreshToken: string): Promise<{ accessToken: string }> => {
    const response = await apiClient.post('/auth/refresh', { refreshToken });
    return unwrapApiResponse<{ accessToken: string }>(response.data);
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER_ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER_REFRESH_TOKEN);
  },
};
