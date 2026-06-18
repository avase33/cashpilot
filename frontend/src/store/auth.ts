import { create } from 'zustand';
import { authApi } from '../lib/api';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, orgName?: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const { accessToken, refreshToken, user } = await authApi.login(email, password);
      localStorage.setItem('cp_access_token', accessToken);
      localStorage.setItem('cp_refresh_token', refreshToken);
      if (user.activeOrg) localStorage.setItem('cp_active_org', user.activeOrg);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (name, email, password, orgName) => {
    set({ isLoading: true });
    try {
      const { accessToken, refreshToken, user, org } = await authApi.register({ name, email, password, orgName });
      localStorage.setItem('cp_access_token', accessToken);
      localStorage.setItem('cp_refresh_token', refreshToken);
      if (org?._id) localStorage.setItem('cp_active_org', org._id);
      set({ user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: () => {
    localStorage.removeItem('cp_access_token');
    localStorage.removeItem('cp_refresh_token');
    localStorage.removeItem('cp_active_org');
    set({ user: null });
  },

  fetchMe: async () => {
    const token = localStorage.getItem('cp_access_token');
    if (!token) { set({ isInitialized: true }); return; }
    try {
      const user = await authApi.me();
      if (user.activeOrg) localStorage.setItem('cp_active_org', user.activeOrg);
      set({ user, isInitialized: true });
    } catch {
      localStorage.removeItem('cp_access_token');
      set({ user: null, isInitialized: true });
    }
  },

  setUser: (user) => set({ user }),
}));
