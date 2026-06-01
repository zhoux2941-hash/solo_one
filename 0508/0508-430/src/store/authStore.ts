import { create } from 'zustand';
import { adminApi } from '../utils/api.js';

interface AuthState {
  isLoggedIn: boolean;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: !!localStorage.getItem('admin_token'),
  token: localStorage.getItem('admin_token'),
  
  login: async (username: string, password: string) => {
    try {
      const result = await adminApi.login(username, password);
      if (result.success && result.token) {
        localStorage.setItem('admin_token', result.token);
        set({ isLoggedIn: true, token: result.token });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ isLoggedIn: false, token: null });
  }
}));
