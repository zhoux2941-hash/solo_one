import { useCallback, useEffect, useRef, useState } from 'react';
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

export function useIPC() {
  const hasElectronAPI = typeof window !== 'undefined' && window.electronAPI;

  const dsl = {
    parse: useCallback(
      async (script: string): Promise<DSLAnalysisResult> => {
        if (!hasElectronAPI) {
          return {
            valid: false,
            errors: [],
            ast: null,
            compiledPreview: '',
          };
        }
        return window.electronAPI.dsl.parse(script);
      },
      [hasElectronAPI]
    ),

    compile: useCallback(
      async (
        script: string,
        device: DeviceType,
        params?: Record<string, string>
      ): Promise<DeviceCompileResult> => {
        if (!hasElectronAPI) {
          throw new Error('Electron API not available');
        }
        return window.electronAPI.dsl.compile(script, device, params);
      },
      [hasElectronAPI]
    ),

    getTemplates: useCallback(async (): Promise<AttackTemplate[]> => {
      if (!hasElectronAPI) return [];
      return window.electronAPI.dsl.getTemplates();
    }, [hasElectronAPI]),

    applyTemplate: useCallback(
      async (
        templateId: string,
        params?: Record<string, string>
      ): Promise<string> => {
        if (!hasElectronAPI) return '';
        return window.electronAPI.dsl.applyTemplate(templateId, params);
      },
      [hasElectronAPI]
    ),
  };

  const detection = {
    start: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.detection.start();
    }, [hasElectronAPI]),

    stop: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.detection.stop();
    }, [hasElectronAPI]),

    status: useCallback(async (): Promise<{ running: boolean; deviceCount: number }> => {
      if (!hasElectronAPI) return { running: false, deviceCount: 0 };
      return window.electronAPI.detection.status();
    }, [hasElectronAPI]),

    getDevices: useCallback(async (): Promise<HIDDevice[]> => {
      if (!hasElectronAPI) return [];
      return window.electronAPI.detection.getDevices();
    }, [hasElectronAPI]),
  };

  const events = {
    query: useCallback(async (filter: QueryFilter): Promise<DetectionAlert[]> => {
      if (!hasElectronAPI) return [];
      return window.electronAPI.events.query(filter);
    }, [hasElectronAPI]),

    get: useCallback(async (id: string): Promise<DetectionAlert> => {
      if (!hasElectronAPI) throw new Error('Electron API not available');
      return window.electronAPI.events.get(id);
    }, [hasElectronAPI]),

    delete: useCallback(async (id: string): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.events.delete(id);
    }, [hasElectronAPI]),

    export: useCallback(
      async (id: string, format: 'json' | 'csv'): Promise<string> => {
        if (!hasElectronAPI) return '';
        return window.electronAPI.events.export(id, format);
      },
      [hasElectronAPI]
    ),
  };

  const service = {
    install: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.service.install();
    }, [hasElectronAPI]),

    uninstall: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.service.uninstall();
    }, [hasElectronAPI]),

    start: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.service.start();
    }, [hasElectronAPI]),

    stop: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.service.stop();
    }, [hasElectronAPI]),

    status: useCallback(async (): Promise<WindowsServiceStatus> => {
      if (!hasElectronAPI) {
        return {
          installed: false,
          running: false,
          autoStart: false,
          logPath: '',
        };
      }
      return window.electronAPI.service.status();
    }, [hasElectronAPI]),

    setConfig: useCallback(async (config: Record<string, unknown>): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.service.setConfig(config);
    }, [hasElectronAPI]),
  };

  const playback = {
    start: useCallback(
      async (events: HIDInputEvent[], options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> => {
        if (!hasElectronAPI) {
          return { success: false, mode: options.mode, scriptPath: '', outputPath: '', message: 'Electron API not available' };
        }
        return window.electronAPI.playback.start(events, options);
      },
      [hasElectronAPI]
    ),

    stop: useCallback(async (): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.playback.stop();
    }, [hasElectronAPI]),

    status: useCallback(async (): Promise<{ sandbox: boolean; vmware: boolean }> => {
      if (!hasElectronAPI) return { sandbox: false, vmware: false };
      return window.electronAPI.playback.status();
    }, [hasElectronAPI]),

    generateScript: useCallback(
      async (events: HIDInputEvent[], options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> => {
        if (!hasElectronAPI) {
          return { success: false, mode: options.mode, scriptPath: '', outputPath: '', message: 'Electron API not available' };
        }
        return window.electronAPI.playback.generateScript(events, options);
      },
      [hasElectronAPI]
    ),
  };

  const virustotal = {
    scanFile: useCallback(async (filePath: string): Promise<VirusTotalScanResult> => {
      if (!hasElectronAPI) throw new Error('Electron API not available');
      return window.electronAPI.virustotal.scanFile(filePath);
    }, [hasElectronAPI]),

    getScan: useCallback(async (scanId: string): Promise<VirusTotalScanResult> => {
      if (!hasElectronAPI) throw new Error('Electron API not available');
      return window.electronAPI.virustotal.getScan(scanId);
    }, [hasElectronAPI]),
  };

  const signatures = {
    list: useCallback(async (): Promise<AttackSignature[]> => {
      if (!hasElectronAPI) return [];
      return window.electronAPI.signatures.list();
    }, [hasElectronAPI]),

    update: useCallback(async (): Promise<{ updated: number; fromRemote: boolean }> => {
      if (!hasElectronAPI) return { updated: 0, fromRemote: false };
      return window.electronAPI.signatures.update();
    }, [hasElectronAPI]),

    add: useCallback(async (signature: AttackSignature): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.signatures.add(signature);
    }, [hasElectronAPI]),

    delete: useCallback(async (id: string): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.signatures.delete(id);
    }, [hasElectronAPI]),
  };

  const settings = {
    get: useCallback(async (): Promise<AppSettings> => {
      if (!hasElectronAPI) {
        return {
          detection: {
            enabled: true,
            minTypingSpeedThreshold: 400,
            shortcutDensityThreshold: 5,
            shortcutTimeWindowMs: 3000,
            minInputIntervalVariance: 0.1,
            mouseEdgeDetection: true,
            alertCooldownMs: 5000,
          },
          virustotal: {
            apiKey: '',
            autoScan: false,
          },
          signatures: {
            autoUpdate: true,
            updateUrl: '',
            checkIntervalHours: 24,
          },
          service: {
            logLevel: 'info',
            logPath: '',
          },
        };
      }
      return window.electronAPI.settings.get();
    }, [hasElectronAPI]),

    set: useCallback(async (settings: AppSettings): Promise<boolean> => {
      if (!hasElectronAPI) return false;
      return window.electronAPI.settings.set(settings);
    }, [hasElectronAPI]),
  };

  return {
    available: hasElectronAPI,
    dsl,
    detection,
    events,
    service,
    playback,
    virustotal,
    signatures,
    settings,
  };
}

export function useIPCEvent<T>(
  eventName: 'onEvent' | 'onAlert',
  callback: (data: T) => void
) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (typeof window === 'undefined' || !window.electronAPI) return;

    let cleanup: (() => void) | undefined;

    if (eventName === 'onEvent') {
      cleanup = window.electronAPI.detection.onEvent((event) => {
        callbackRef.current(event as unknown as T);
      });
    } else if (eventName === 'onAlert') {
      cleanup = window.electronAPI.detection.onAlert((alert) => {
        callbackRef.current(alert as unknown as T);
      });
    }

    return () => {
      cleanup?.();
    };
  }, [eventName]);
}

export function useAsyncIPC<T, A extends unknown[]>(
  fn: (...args: A) => Promise<T>,
  ...args: A
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(
    async (...executeArgs: A) => {
      setLoading(true);
      setError(null);
      try {
        const result = await fn(...executeArgs);
        setData(result);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [fn]
  );

  useEffect(() => {
    if (args.length > 0 && args[0] !== undefined) {
      execute(...args);
    }
  }, []);

  return { data, loading, error, refetch: execute };
}
