import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authApi } from '@/api/auth';
import { AUTH_STORAGE_KEYS } from '@/constants/auth';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
        }),

      setTokens: (accessToken, refreshToken) => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.setItem(AUTH_STORAGE_KEYS.USER_ACCESS_TOKEN, accessToken);
        localStorage.setItem(AUTH_STORAGE_KEYS.USER_REFRESH_TOKEN, refreshToken);
        set({ accessToken, refreshToken, isAuthenticated: true });
      },

      logout: () => {
        authApi.logout();
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      initialize: () => {
        const accessToken =
          localStorage.getItem(AUTH_STORAGE_KEYS.USER_ACCESS_TOKEN) ||
          localStorage.getItem('accessToken');
        const refreshToken =
          localStorage.getItem(AUTH_STORAGE_KEYS.USER_REFRESH_TOKEN) ||
          localStorage.getItem('refreshToken');
        
        if (accessToken && refreshToken) {
          set({
            accessToken,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
