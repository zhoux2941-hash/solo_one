import { create } from 'zustand';
import { MockApiConfig, HttpMethod, RequestLog } from '../types';
import {
  fetchMockApis,
  createMockApi,
  updateMockApi,
  deleteMockApi,
  toggleMockApi,
  fetchRequestLogs,
  clearRequestLogs,
  CreateMockApiRequest,
  UpdateMockApiRequest
} from '../utils/apiService';

interface MockApiState {
  apis: MockApiConfig[];
  logs: RequestLog[];
  isLoading: boolean;
  isLogsLoading: boolean;
  isServerOnline: boolean;
  activeTab: 'data' | 'api';
  logsPanelOpen: boolean;
  
  setActiveTab: (tab: 'data' | 'api') => void;
  setLogsPanelOpen: (open: boolean) => void;
  loadApis: () => Promise<void>;
  loadLogs: () => Promise<void>;
  clearLogs: () => Promise<void>;
  createApi: (payload: CreateMockApiRequest) => Promise<MockApiConfig>;
  updateApi: (id: string, payload: UpdateMockApiRequest) => Promise<MockApiConfig>;
  deleteApi: (id: string) => Promise<void>;
  toggleApi: (id: string) => Promise<void>;
  checkServerHealth: () => Promise<void>;
}

export const useMockApiStore = create<MockApiState>((set, get) => ({
  apis: [],
  logs: [],
  isLoading: false,
  isLogsLoading: false,
  isServerOnline: false,
  activeTab: 'data',
  logsPanelOpen: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setLogsPanelOpen: (open) => set({ logsPanelOpen: open }),

  loadApis: async () => {
    set({ isLoading: true });
    try {
      const data = await fetchMockApis();
      set({ apis: data, isServerOnline: true });
    } catch {
      set({ isServerOnline: false });
    } finally {
      set({ isLoading: false });
    }
  },

  loadLogs: async () => {
    set({ isLogsLoading: true });
    try {
      const data = await fetchRequestLogs();
      set({ logs: data });
    } catch (error) {
      console.error('加载日志失败:', error);
    } finally {
      set({ isLogsLoading: false });
    }
  },

  clearLogs: async () => {
    try {
      await clearRequestLogs();
      set({ logs: [] });
    } catch (error) {
      console.error('清除日志失败:', error);
    }
  },

  createApi: async (payload) => {
    const result = await createMockApi(payload);
    set((state) => ({ apis: [...state.apis, result] }));
    return result;
  },

  updateApi: async (id, payload) => {
    const result = await updateMockApi(id, payload);
    set((state) => ({
      apis: state.apis.map((api) => (api.id === id ? result : api))
    }));
    return result;
  },

  deleteApi: async (id) => {
    await deleteMockApi(id);
    set((state) => ({
      apis: state.apis.filter((api) => api.id !== id)
    }));
  },

  toggleApi: async (id) => {
    const result = await toggleMockApi(id);
    set((state) => ({
      apis: state.apis.map((api) => (api.id === id ? result : api))
    }));
  },

  checkServerHealth: async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      set({ isServerOnline: response.ok });
    } catch {
      set({ isServerOnline: false });
    }
  }
}));
