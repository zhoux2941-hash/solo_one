import { create } from 'zustand';
import { User, MemberProfile } from '../../shared/types';
import * as api from '../lib/api';

interface AuthState {
  user: User | null;
  memberProfile: MemberProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string, role: 'member' | 'coach') => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  refreshMemberProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  memberProfile: null,
  token: localStorage.getItem('token'),
  isLoading: false,

  login: async (phone, password, role) => {
    set({ isLoading: true });
    try {
      const response = await api.login({ phone, password, role });
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      set({
        user: response.user,
        memberProfile: response.memberProfile || null,
        token: response.token,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({
      user: null,
      memberProfile: null,
      token: null,
    });
  },

  loadUser: async () => {
    const token = get().token;
    if (!token) return;

    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        set({ user: JSON.parse(userStr) });
      }
    } catch (error) {
      console.error('Failed to load user:', error);
    }
  },

  refreshMemberProfile: async () => {
    const user = get().user;
    if (!user || user.role !== 'member') return;

    try {
      const bookings = await api.getMemberBookings();
      const packages = await api.getPackages();
      
      const totalPurchased = packages.reduce((sum, p) => sum + p.classes, 0);
      const totalUsed = bookings.filter(b => b.status === 'completed').length;
      const remainingClasses = bookings.filter(b => b.status === 'pending').length > 0 
        ? get().memberProfile?.remainingClasses || 0
        : 0;

      set({
        memberProfile: {
          userId: user.id,
          memberId: user.id,
          remainingClasses,
          totalPurchased,
          totalUsed,
        },
      });
    } catch (error) {
      console.error('Failed to refresh member profile:', error);
    }
  },
}));
