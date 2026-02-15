import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { AUTH_STORAGE_KEYS } from '@/constants/auth';
import { adminAuthApi } from '@/api/adminAuth';

interface AdminAuthState {
  admin: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  setAdmin: (admin: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAdminAuthStore = create<AdminAuthState>()(
  persist(
    (set) => ({
      admin: null,
      accessToken: null,
      refreshToken: null,
      isAdminAuthenticated: false,
      isLoading: true,

      setAdmin: (admin) =>
        set({
          admin,
          isAdminAuthenticated: !!admin,
        }),

      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem(AUTH_STORAGE_KEYS.ADMIN_ACCESS_TOKEN, accessToken);
        localStorage.setItem(AUTH_STORAGE_KEYS.ADMIN_REFRESH_TOKEN, refreshToken);
        set({ accessToken, refreshToken, isAdminAuthenticated: true });
      },

      logout: () => {
        adminAuthApi.logout();
        set({
          admin: null,
          accessToken: null,
          refreshToken: null,
          isAdminAuthenticated: false,
        });
      },

      initialize: () => {
        const accessToken = localStorage.getItem(AUTH_STORAGE_KEYS.ADMIN_ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(AUTH_STORAGE_KEYS.ADMIN_REFRESH_TOKEN);

        if (accessToken && refreshToken) {
          set({
            accessToken,
            refreshToken,
            isAdminAuthenticated: true,
            isLoading: false,
          });
        } else {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        admin: state.admin,
      }),
    }
  )
);
