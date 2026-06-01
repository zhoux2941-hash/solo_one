import { contextBridge, ipcRenderer, shell } from 'electron';
import type {
  DSLAnalysisResult,
  DeviceCompileResult,
  DeviceType,
  HIDDevice,
  HIDInputEvent,
  DetectionAlert,
  AttackSignature,
  AttackTemplate,
  WindowsServiceStatus,
  VirusTotalScanResult,
  AppSettings,
  QueryFilter,
  SandboxPlaybackResult,
  SandboxPlaybackOptions,
} from '@shared/types';
import { IPC_CHANNELS } from '@shared/constants';

contextBridge.exposeInMainWorld('electronAPI', {
  dsl: {
    parse: (script: string): Promise<DSLAnalysisResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.DSL_PARSE, script),
    compile: (script: string, device: DeviceType, params?: Record<string, string>): Promise<DeviceCompileResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.DSL_COMPILE, { script, device, params }),
    getTemplates: (): Promise<AttackTemplate[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.DSL_TEMPLATES),
    applyTemplate: (templateId: string, params?: Record<string, string>): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.DSL_TEMPLATE_APPLY, { templateId, params }),
  },

  detection: {
    start: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DETECTION_START),
    stop: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.DETECTION_STOP),
    status: (): Promise<{ running: boolean; deviceCount: number }> =>
      ipcRenderer.invoke(IPC_CHANNELS.DETECTION_STATUS),
    getDevices: (): Promise<HIDDevice[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.DETECTION_DEVICES),
    onEvent: (callback: (event: HIDInputEvent) => void) => {
      ipcRenderer.on(IPC_CHANNELS.DETECTION_EVENTS, (_, event) => callback(event));
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DETECTION_EVENTS, (_) => {});
    },
    onAlert: (callback: (alert: DetectionAlert) => void) => {
      ipcRenderer.on(IPC_CHANNELS.DETECTION_ALERT, (_, alert) => callback(alert));
      return () => ipcRenderer.removeListener(IPC_CHANNELS.DETECTION_ALERT, (_) => {});
    },
  },

  events: {
    query: (filter: QueryFilter): Promise<DetectionAlert[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.EVENTS_QUERY, filter),
    get: (id: string): Promise<DetectionAlert> =>
      ipcRenderer.invoke(IPC_CHANNELS.EVENTS_GET, id),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.EVENTS_DELETE, id),
    export: (id: string, format: 'json' | 'csv'): Promise<string> =>
      ipcRenderer.invoke(IPC_CHANNELS.EVENTS_EXPORT, { id, format }),
  },

  service: {
    install: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERVICE_INSTALL),
    uninstall: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERVICE_UNINSTALL),
    start: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERVICE_START),
    stop: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERVICE_STOP),
    status: (): Promise<WindowsServiceStatus> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERVICE_STATUS),
    setConfig: (config: Record<string, unknown>): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SERVICE_CONFIG_SET, config),
  },

  playback: {
    start: (events: HIDInputEvent[], options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAYBACK_START, events, options),
    stop: (): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAYBACK_STOP),
    status: (): Promise<{ sandbox: boolean; vmware: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.PLAYBACK_STATUS),
    generateScript: (events: HIDInputEvent[], options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> =>
      ipcRenderer.invoke('playback:generate-script', events, options),
  },

  shell: {
    openPath: (path: string): Promise<string> =>
      shell.openPath(path),
  },

  virustotal: {
    scanFile: (filePath: string): Promise<VirusTotalScanResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.VIRUSTOTAL_SCAN, filePath),
    getScan: (scanId: string): Promise<VirusTotalScanResult> =>
      ipcRenderer.invoke(IPC_CHANNELS.VIRUSTOTAL_SCAN_GET, scanId),
  },

  signatures: {
    list: (): Promise<AttackSignature[]> =>
      ipcRenderer.invoke(IPC_CHANNELS.SIGNATURES_LIST),
    update: (): Promise<{ updated: number; fromRemote: boolean }> =>
      ipcRenderer.invoke(IPC_CHANNELS.SIGNATURES_UPDATE),
    add: (signature: AttackSignature): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SIGNATURES_ADD, signature),
    delete: (id: string): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SIGNATURES_DELETE, id),
  },

  settings: {
    get: (): Promise<AppSettings> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_GET),
    set: (settings: AppSettings): Promise<boolean> =>
      ipcRenderer.invoke(IPC_CHANNELS.SETTINGS_SET, settings),
  },
});

declare global {
  interface Window {
    electronAPI: {
      dsl: {
        parse: (script: string) => Promise<DSLAnalysisResult>;
        compile: (script: string, device: DeviceType, params?: Record<string, string>) => Promise<DeviceCompileResult>;
        getTemplates: () => Promise<AttackTemplate[]>;
        applyTemplate: (templateId: string, params?: Record<string, string>) => Promise<string>;
      };
      detection: {
        start: () => Promise<boolean>;
        stop: () => Promise<boolean>;
        status: () => Promise<{ running: boolean; deviceCount: number }>;
        getDevices: () => Promise<HIDDevice[]>;
        onEvent: (callback: (event: HIDInputEvent) => void) => () => void;
        onAlert: (callback: (alert: DetectionAlert) => void) => () => void;
      };
      events: {
        query: (filter: QueryFilter) => Promise<DetectionAlert[]>;
        get: (id: string) => Promise<DetectionAlert>;
        delete: (id: string) => Promise<boolean>;
        export: (id: string, format: 'json' | 'csv') => Promise<string>;
      };
      service: {
        install: () => Promise<boolean>;
        uninstall: () => Promise<boolean>;
        start: () => Promise<boolean>;
        stop: () => Promise<boolean>;
        status: () => Promise<WindowsServiceStatus>;
        setConfig: (config: Record<string, unknown>) => Promise<boolean>;
      };
      playback: {
        start: (events: HIDInputEvent[], options: SandboxPlaybackOptions) => Promise<SandboxPlaybackResult>;
        stop: () => Promise<boolean>;
        status: () => Promise<{ sandbox: boolean; vmware: boolean }>;
        generateScript: (events: HIDInputEvent[], options: SandboxPlaybackOptions) => Promise<SandboxPlaybackResult>;
      };
      shell: {
        openPath: (path: string) => Promise<string>;
      };
      virustotal: {
        scanFile: (filePath: string) => Promise<VirusTotalScanResult>;
        getScan: (scanId: string) => Promise<VirusTotalScanResult>;
      };
      signatures: {
        list: () => Promise<AttackSignature[]>;
        update: () => Promise<{ updated: number; fromRemote: boolean }>;
        add: (signature: AttackSignature) => Promise<boolean>;
        delete: (id: string) => Promise<boolean>;
      };
      settings: {
        get: () => Promise<AppSettings>;
        set: (settings: AppSettings) => Promise<boolean>;
      };
    };
  }
}
