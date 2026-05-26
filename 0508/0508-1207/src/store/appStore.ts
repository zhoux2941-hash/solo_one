import { create } from 'zustand';

export type AppRole = 'student' | 'admin' | null;

interface AppState {
  role: AppRole;
  studentId: string | null;
  studentName: string | null;
  adminToken: string | null;
  adminUser: { id: number; username: string; clubId: number; clubName: string } | null;
  setStudent: (id: string, name: string) => void;
  setAdmin: (user: { id: number; username: string; clubId: number; clubName: string }) => void;
  logout: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  role: null,
  studentId: null,
  studentName: null,
  adminToken: null,
  adminUser: null,
  setStudent: (id, name) => set({ role: 'student', studentId: id, studentName: name }),
  setAdmin: (user) => set({ role: 'admin', adminUser: user }),
  logout: () =>
    set({
      role: null,
      studentId: null,
      studentName: null,
      adminToken: null,
      adminUser: null,
    }),
}));
