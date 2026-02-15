import axios from 'axios';
import { unwrapApiResponse } from './unwrap';
import { AuthResponse, LoginRequest, UserRole } from '@/types';
import { AUTH_STORAGE_KEYS } from '@/constants/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export const adminAuthApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });
    const data = unwrapApiResponse<AuthResponse>(response.data);

    if (data.user.role !== UserRole.ADMIN) {
      throw new Error('Access denied. Admin role required.');
    }

    return data;
  },

  logout: () => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_ACCESS_TOKEN);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
  },
};
