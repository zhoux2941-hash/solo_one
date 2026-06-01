import { create } from 'zustand';
import type {
  HIDDevice,
  HIDInputEvent,
  DetectionAlert,
  AppSettings,
  DeviceType,
  DSLAnalysisResult,
  DeviceCompileResult,
} from '@shared/types';
import { DEFAULT_SETTINGS } from '@shared/constants';

export interface DetectionState {
  running: boolean;
  deviceCount: number;
}

export interface CompileState {
  isCompiling: boolean;
  result: DeviceCompileResult | null;
  error: string | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  progress: number;
  speed: number;
}

export interface UIState {
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  activeTab: 'editor' | 'detection' | 'alerts' | 'devices' | 'settings';
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
}

export interface AppStore {
  detection: DetectionState;
  alerts: DetectionAlert[];
  devices: HIDDevice[];
  recentEvents: HIDInputEvent[];
  currentScript: string;
  currentDevice: DeviceType;
  analysisResult: DSLAnalysisResult | null;
  compileState: CompileState;
  playbackState: PlaybackState;
  settings: AppSettings;
  ui: UIState;

  setDetectionRunning: (running: boolean) => void;
  setDeviceCount: (count: number) => void;
  addAlert: (alert: DetectionAlert) => void;
  clearAlerts: () => void;
  removeAlert: (id: string) => void;
  setDevices: (devices: HIDDevice[]) => void;
  addDevice: (device: HIDDevice) => void;
  removeDevice: (devicePath: string) => void;
  addRecentEvent: (event: HIDInputEvent) => void;
  clearRecentEvents: () => void;
  setCurrentScript: (script: string) => void;
  setCurrentDevice: (device: DeviceType) => void;
  setAnalysisResult: (result: DSLAnalysisResult | null) => void;
  setCompiling: (isCompiling: boolean) => void;
  setCompileResult: (result: DeviceCompileResult | null) => void;
  setCompileError: (error: string | null) => void;
  setPlaying: (isPlaying: boolean) => void;
  setPlaybackProgress: (progress: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  setSettings: (settings: AppSettings) => void;
  updateSettings: (updates: Partial<AppSettings>) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: UIState['theme']) => void;
  setActiveTab: (tab: UIState['activeTab']) => void;
  addNotification: (
    type: UIState['notifications'][0]['type'],
    message: string
  ) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  resetStore: () => void;
}

const initialState: Omit<
  AppStore,
  | 'setDetectionRunning'
  | 'setDeviceCount'
  | 'addAlert'
  | 'clearAlerts'
  | 'removeAlert'
  | 'setDevices'
  | 'addDevice'
  | 'removeDevice'
  | 'addRecentEvent'
  | 'clearRecentEvents'
  | 'setCurrentScript'
  | 'setCurrentDevice'
  | 'setAnalysisResult'
  | 'setCompiling'
  | 'setCompileResult'
  | 'setCompileError'
  | 'setPlaying'
  | 'setPlaybackProgress'
  | 'setPlaybackSpeed'
  | 'setSettings'
  | 'updateSettings'
  | 'setSidebarCollapsed'
  | 'setTheme'
  | 'setActiveTab'
  | 'addNotification'
  | 'removeNotification'
  | 'clearNotifications'
  | 'resetStore'
> = {
  detection: {
    running: false,
    deviceCount: 0,
  },
  alerts: [],
  devices: [],
  recentEvents: [],
  currentScript: '',
  currentDevice: 'pico',
  analysisResult: null,
  compileState: {
    isCompiling: false,
    result: null,
    error: null,
  },
  playbackState: {
    isPlaying: false,
    progress: 0,
    speed: 1,
  },
  settings: DEFAULT_SETTINGS,
  ui: {
    sidebarCollapsed: false,
    theme: 'dark',
    activeTab: 'editor',
    notifications: [],
  },
};

export const useAppStore = create<AppStore>((set) => ({
  ...initialState,

  setDetectionRunning: (running: boolean) =>
    set((state) => ({
      detection: { ...state.detection, running },
    })),

  setDeviceCount: (count: number) =>
    set((state) => ({
      detection: { ...state.detection, deviceCount: count },
    })),

  addAlert: (alert: DetectionAlert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts].slice(0, 100),
    })),

  clearAlerts: () => set({ alerts: [] }),

  removeAlert: (id: string) =>
    set((state) => ({
      alerts: state.alerts.filter((a) => a.id !== id),
    })),

  setDevices: (devices: HIDDevice[]) => set({ devices }),

  addDevice: (device: HIDDevice) =>
    set((state) => {
      const exists = state.devices.some((d) => d.devicePath === device.devicePath);
      if (exists) {
        return {
          devices: state.devices.map((d) =>
            d.devicePath === device.devicePath ? device : d
          ),
        };
      }
      return { devices: [...state.devices, device] };
    }),

  removeDevice: (devicePath: string) =>
    set((state) => ({
      devices: state.devices.filter((d) => d.devicePath !== devicePath),
    })),

  addRecentEvent: (event: HIDInputEvent) =>
    set((state) => ({
      recentEvents: [event, ...state.recentEvents].slice(0, 50),
    })),

  clearRecentEvents: () => set({ recentEvents: [] }),

  setCurrentScript: (script: string) => set({ currentScript: script }),

  setCurrentDevice: (device: DeviceType) => set({ currentDevice: device }),

  setAnalysisResult: (result: DSLAnalysisResult | null) =>
    set({ analysisResult: result }),

  setCompiling: (isCompiling: boolean) =>
    set((state) => ({
      compileState: { ...state.compileState, isCompiling },
    })),

  setCompileResult: (result: DeviceCompileResult | null) =>
    set((state) => ({
      compileState: { ...state.compileState, result, error: null },
    })),

  setCompileError: (error: string | null) =>
    set((state) => ({
      compileState: { ...state.compileState, error, result: null },
    })),

  setPlaying: (isPlaying: boolean) =>
    set((state) => ({
      playbackState: { ...state.playbackState, isPlaying },
    })),

  setPlaybackProgress: (progress: number) =>
    set((state) => ({
      playbackState: { ...state.playbackState, progress },
    })),

  setPlaybackSpeed: (speed: number) =>
    set((state) => ({
      playbackState: { ...state.playbackState, speed },
    })),

  setSettings: (settings: AppSettings) => set({ settings }),

  updateSettings: (updates: Partial<AppSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...updates },
    })),

  setSidebarCollapsed: (collapsed: boolean) =>
    set((state) => ({
      ui: { ...state.ui, sidebarCollapsed: collapsed },
    })),

  setTheme: (theme: UIState['theme']) =>
    set((state) => ({
      ui: { ...state.ui, theme },
    })),

  setActiveTab: (tab: UIState['activeTab']) =>
    set((state) => ({
      ui: { ...state.ui, activeTab: tab },
    })),

  addNotification: (type, message) =>
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: [
          {
            id: Date.now().toString(),
            type,
            message,
            timestamp: new Date(),
          },
          ...state.ui.notifications,
        ].slice(0, 10),
      },
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      ui: {
        ...state.ui,
        notifications: state.ui.notifications.filter((n) => n.id !== id),
      },
    })),

  clearNotifications: () =>
    set((state) => ({
      ui: { ...state.ui, notifications: [] },
    })),

  resetStore: () => set(initialState),
}));

export const selectDetection = (state: AppStore) => state.detection;
export const selectAlerts = (state: AppStore) => state.alerts;
export const selectDevices = (state: AppStore) => state.devices;
export const selectRecentEvents = (state: AppStore) => state.recentEvents;
export const selectCurrentScript = (state: AppStore) => state.currentScript;
export const selectCurrentDevice = (state: AppStore) => state.currentDevice;
export const selectAnalysisResult = (state: AppStore) => state.analysisResult;
export const selectCompileState = (state: AppStore) => state.compileState;
export const selectPlaybackState = (state: AppStore) => state.playbackState;
export const selectSettings = (state: AppStore) => state.settings;
export const selectUI = (state: AppStore) => state.ui;
