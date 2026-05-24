import { create } from 'zustand';
import {
  RadiationSourceApplication,
  Room,
  Escort,
  ConflictResult,
  DailyReport,
} from '../../shared/types';

interface AppState {
  applications: RadiationSourceApplication[];
  rooms: Room[];
  escorts: Escort[];
  dailyReport: DailyReport | null;
  currentConflict: ConflictResult | null;
  isLoading: boolean;
  error: string | null;
  selectedApplication: RadiationSourceApplication | null;
  showEditModal: boolean;

  setApplications: (apps: RadiationSourceApplication[]) => void;
  setRooms: (rooms: Room[]) => void;
  setEscorts: (escorts: Escort[]) => void;
  setDailyReport: (report: DailyReport) => void;
  setCurrentConflict: (conflict: ConflictResult | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedApplication: (app: RadiationSourceApplication | null) => void;
  setShowEditModal: (show: boolean) => void;
  
  addApplication: (app: RadiationSourceApplication) => void;
  updateApplication: (app: RadiationSourceApplication) => void;
  removeApplication: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  applications: [],
  rooms: [],
  escorts: [],
  dailyReport: null,
  currentConflict: null,
  isLoading: false,
  error: null,
  selectedApplication: null,
  showEditModal: false,

  setApplications: (apps) => set({ applications: apps }),
  setRooms: (rooms) => set({ rooms }),
  setEscorts: (escorts) => set({ escorts }),
  setDailyReport: (report) => set({ dailyReport: report }),
  setCurrentConflict: (conflict) => set({ currentConflict: conflict }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSelectedApplication: (app) => set({ selectedApplication: app }),
  setShowEditModal: (show) => set({ showEditModal: show }),

  addApplication: (app) =>
    set((state) => ({ applications: [...state.applications, app] })),
  updateApplication: (app) =>
    set((state) => ({
      applications: state.applications.map((a) => (a.id === app.id ? app : a)),
    })),
  removeApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    })),
}));
