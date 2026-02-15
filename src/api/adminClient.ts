import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { toast } from 'react-toastify';
import { unwrapApiResponse } from './unwrap';
import { toCamelDeep } from './transform';
import { AUTH_STORAGE_KEYS } from '@/constants/auth';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

class AdminApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem(AUTH_STORAGE_KEYS.ADMIN_ACCESS_TOKEN);
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => {
        response.data = toCamelDeep(response.data);
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
            if (!refreshToken) {
              throw new Error('No admin refresh token');
            }

            const response = await axios.post(
              `${BASE_URL}/auth/refresh`,
              { refreshToken },
              { withCredentials: true }
            );

            const { accessToken } = unwrapApiResponse<{ accessToken: string }>(response.data);
            localStorage.setItem(AUTH_STORAGE_KEYS.ADMIN_ACCESS_TOKEN, accessToken);

            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            }

            return this.client(originalRequest);
          } catch (refreshError) {
            localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_ACCESS_TOKEN);
            localStorage.removeItem(AUTH_STORAGE_KEYS.ADMIN_REFRESH_TOKEN);
            window.location.href = '/admin/login';
            return Promise.reject(refreshError);
          }
        }

        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  private handleError(error: AxiosError<any>) {
    if (error.response) {
      const message = error.response.data?.message || 'An error occurred';
      toast.error(message);
    } else if (error.request) {
      toast.error('Network error. Please check your connection.');
    } else {
      toast.error('An unexpected error occurred');
    }
  }

  public getInstance(): AxiosInstance {
    return this.client;
  }
}

export const adminApiClient = new AdminApiClient().getInstance();
