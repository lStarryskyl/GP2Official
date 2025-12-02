import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, RegisterRequest } from '@/types';
import { api } from '@/lib/api';

const normalizeErrorMessage = (value: any, fallback: string) => {
  if (!value) return fallback;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) {
    const parts = value.map((item) => {
      if (!item) return '';
      if (typeof item === 'string') return item;
      if (typeof item === 'object') {
        const loc = Array.isArray(item.loc) ? item.loc.join('.') : item.loc;
        const msg = item.msg || item.message || '';
        return loc ? `${loc}: ${msg}` : msg || JSON.stringify(item);
      }
      return String(item);
    });
    return parts.filter(Boolean).join(' | ') || fallback;
  }
  if (typeof value === 'object') {
    if (value.msg) return value.msg;
    if (value.message) return value.message;
    if (value.detail) return normalizeErrorMessage(value.detail, fallback);
    return JSON.stringify(value);
  }
  return String(value);
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response: any = await api.login(email, password);
          localStorage.setItem('access_token', response.access_token);
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const raw = error.response?.data?.detail || error.response?.data?.error || 'Login failed';
          const message = normalizeErrorMessage(raw, 'Login failed');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response: any = await api.register(data);
          localStorage.setItem('access_token', response.access_token);
          if (response.refresh_token) {
            localStorage.setItem('refresh_token', response.refresh_token);
          }
          set({
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: any) {
          const raw = error.response?.data?.detail || error.response?.data?.error || 'Registration failed';
          const message = normalizeErrorMessage(raw, 'Registration failed');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          try {
            await api.logout(refreshToken);
          } catch (error) {
            console.warn('Failed to revoke refresh token', error);
          }
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        try {
          const user = await api.getMe();
          set({ user, isAuthenticated: true });
        } catch (error) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          set({ isAuthenticated: false, user: null });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
