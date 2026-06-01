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

export interface ElectronAPI {
  dsl: {
    parse: (script: string) => Promise<DSLAnalysisResult>;
    compile: (
      script: string,
      device: DeviceType,
      params?: Record<string, string>
    ) => Promise<DeviceCompileResult>;
    getTemplates: () => Promise<AttackTemplate[]>;
    applyTemplate: (
      templateId: string,
      params?: Record<string, string>
    ) => Promise<string>;
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
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
