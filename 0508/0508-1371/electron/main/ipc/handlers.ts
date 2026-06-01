import { ipcMain, BrowserWindow } from 'electron';
import { db } from '../database/db';
import { Parser } from '../compiler/parser';
import { ArduinoGenerator } from '../generators/arduino';
import { PicoGenerator } from '../generators/pico';
import { BadUSBGenerator } from '../generators/badusb';
import { FlipperGenerator } from '../generators/flipper';
import { BehaviorAnalyzer } from '../detection/analyzer';
import { SignatureEngine } from '../detection/signatures';
import { HIDListener } from '../detection/hid-listener';
import type { DSLAnalysisResult as CompilerDSLResult } from '../compiler/ast';
import type {
  HIDDevice,
  HIDInputEvent,
  DetectionAlert,
  AttackSignature,
  VirusTotalScanResult,
  AppSettings,
  QueryFilter,
  DeviceType,
  DSLAnalysisResult,
  CompiledPayload,
  WindowsServiceStatus,
  ASTNode,
  SandboxPlaybackResult,
  SandboxPlaybackOptions,
} from '@shared/types';
import axios from 'axios';
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { Service } from 'node-windows';

interface HandlerContext {
  mainWindow: BrowserWindow | null;
  analyzer: BehaviorAnalyzer;
  signatureEngine: SignatureEngine;
  hidListener: HIDListener | null;
  detectionEnabled: boolean;
}

const context: HandlerContext = {
  mainWindow: null,
  analyzer: new BehaviorAnalyzer(),
  signatureEngine: new SignatureEngine(),
  hidListener: null,
  detectionEnabled: false,
};

export function setMainWindow(window: BrowserWindow | null): void {
  context.mainWindow = window;
}

export function initializeIPC(): void {
  ipcMain.handle('dsl:parse', async (_, source: string): Promise<DSLAnalysisResult> => {
    try {
      const parser = new Parser();
      const result: CompilerDSLResult = parser.parseScript(source);
      return {
        valid: result.errors.length === 0,
        errors: result.errors.map((e) => ({
          line: e.line,
          column: e.column,
          message: e.message,
          severity: 'error' as const,
        })),
        ast: (result.ast?.body as unknown as ASTNode[]) || null,
        compiledPreview: '',
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{ line: 1, column: 1, message: String(error), severity: 'error' as const }],
        ast: null,
        compiledPreview: '',
      };
    }
  });

  ipcMain.handle(
    'dsl:compile',
    async (
      _,
      source: string,
      targetDevice: DeviceType,
      outputPath?: string
    ): Promise<{ success: boolean; outputPath?: string; errors: string[]; fileSize?: number }> => {
      try {
        const parser = new Parser();
        const parseResult: CompilerDSLResult = parser.parseScript(source);

        if (parseResult.errors.length > 0) {
          return {
            success: false,
            errors: parseResult.errors.map((e) => e.message),
          };
        }

        if (!parseResult.ast) {
          return { success: false, errors: ['No AST generated'] };
        }

        let generator;
        switch (targetDevice) {
          case 'arduino':
            generator = new ArduinoGenerator();
            break;
          case 'pico':
            generator = new PicoGenerator();
            break;
          case 'badusb':
            generator = new BadUSBGenerator();
            break;
          case 'flipper':
            generator = new FlipperGenerator();
            break;
          default:
            return { success: false, errors: ['Unsupported device type'] };
        }

        const output = generator.generate(parseResult.ast.body as any);

        const finalOutputPath =
          outputPath || path.join(process.cwd(), `output.${output.fileExtension}`);
        await fs.writeFile(finalOutputPath, output.code);

        const stats = await fs.stat(finalOutputPath);

        const payload: Omit<CompiledPayload, 'id'> = {
          originalScript: source,
          targetDevice,
          outputPath: finalOutputPath,
          fileHash: crypto.createHash('sha256').update(output.code).digest('hex'),
          compiledAt: new Date(),
          paramsJson: JSON.stringify({}),
        };
        db.addPayload(payload);

        return {
          success: true,
          outputPath: finalOutputPath,
          errors: [],
          fileSize: stats.size,
        };
      } catch (error) {
        return { success: false, errors: [String(error)] };
      }
    }
  );

  ipcMain.handle('detection:start', async (): Promise<boolean> => {
    try {
      if (context.hidListener) {
        return true;
      }

      context.hidListener = new HIDListener();

      context.hidListener.on('device-attached', (device: HIDDevice) => {
        db.addDevice(device);
        context.mainWindow?.webContents.send('detection:device-connected', device);
      });

      context.hidListener.on('device-detached', (device: HIDDevice) => {
        context.mainWindow?.webContents.send('detection:device-disconnected', device.devicePath);
      });

      context.hidListener.on('input-event', (event: HIDInputEvent) => {
        if (!context.detectionEnabled) return;

        const analysisResult = context.analyzer.processEvent(event);
        const signatureAlerts = context.signatureEngine.match([event]);

        const allAlerts = [...analysisResult.alerts, ...signatureAlerts];

        for (const alert of allAlerts) {
          const dbDevice = db.getDeviceByPath(event.devicePath);
          db.addAlert({
            ...alert,
            deviceId: dbDevice?.id,
          });
          context.mainWindow?.webContents.send('detection:alert', alert);
        }

        db.addEvent(event);
        context.mainWindow?.webContents.send('detection:event', event);
      });

      context.hidListener.startListening();
      context.detectionEnabled = true;
      return true;
    } catch (error) {
      console.error('Failed to start detection:', error);
      return false;
    }
  });

  ipcMain.handle('detection:stop', async (): Promise<boolean> => {
    try {
      if (context.hidListener) {
        context.hidListener.stopListening();
        context.hidListener = null;
      }
      context.detectionEnabled = false;
      return true;
    } catch (error) {
      console.error('Failed to stop detection:', error);
      return false;
    }
  });

  ipcMain.handle('detection:status', async (): Promise<{ running: boolean; deviceCount: number }> => {
    return {
      running: context.detectionEnabled,
      deviceCount: db.getAllDevices().length,
    };
  });

  ipcMain.handle('detection:get-devices', async (): Promise<HIDDevice[]> => {
    return db.getAllDevices();
  });

  ipcMain.handle('detection:block-device', async (_, deviceId: number): Promise<boolean> => {
    try {
      db.setDeviceBlocked(deviceId, true);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('detection:unblock-device', async (_, deviceId: number): Promise<boolean> => {
    try {
      db.setDeviceBlocked(deviceId, false);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('events:query', async (_, filter: QueryFilter): Promise<HIDInputEvent[]> => {
    return db.queryEvents(filter);
  });

  ipcMain.handle('events:get-by-device', async (_, deviceId: number, limit: number = 100) => {
    return db.getEventsByDeviceId(deviceId, limit);
  });

  ipcMain.handle('events:get-by-alert', async (_, alertId: number) => {
    return db.getEventsByAlertId(alertId);
  });

  ipcMain.handle('alerts:query', async (_, filter: QueryFilter): Promise<DetectionAlert[]> => {
    return db.queryAlerts(filter);
  });

  ipcMain.handle('alerts:get-by-id', async (_, id: number): Promise<DetectionAlert | null> => {
    return db.getAlertById(id);
  });

  ipcMain.handle('alerts:mark-reviewed', async (_, id: number, notes?: string): Promise<boolean> => {
    try {
      db.markAlertAsReviewed(id, notes);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('alerts:delete', async (_, id: number): Promise<boolean> => {
    try {
      db.deleteAlert(id);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('service:status', async (): Promise<WindowsServiceStatus> => {
    try {
      const svc = new Service({
        name: 'HIDDetectionService',
        script: path.join(__dirname, 'service.js'),
      });

      return new Promise((resolve) => {
        svc.on('status', (status: string) => {
          resolve({
            installed: status !== 'Not Found',
            running: status === 'Running',
            autoStart: status === 'Running',
            logPath: '',
          });
        });
        svc.status;
      });
    } catch {
      return {
        installed: false,
        running: false,
        autoStart: false,
        logPath: '',
      };
    }
  });

  ipcMain.handle('service:install', async (): Promise<boolean> => {
    try {
      const svc = new Service({
        name: 'HIDDetectionService',
        script: path.join(__dirname, 'service.js'),
      });
      svc.install();
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('service:uninstall', async (): Promise<boolean> => {
    try {
      const svc = new Service({
        name: 'HIDDetectionService',
        script: '',
      });
      svc.uninstall();
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('service:start', async (): Promise<boolean> => {
    try {
      const svc = new Service({
        name: 'HIDDetectionService',
        script: '',
      });
      svc.start();
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('service:stop', async (): Promise<boolean> => {
    try {
      const svc = new Service({
        name: 'HIDDetectionService',
        script: '',
      });
      svc.stop();
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('playback:start', async (_, events: HIDInputEvent[], options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> => {
    try {
      const { playbackEngine } = await import('../playback/player');
      playbackEngine.loadEvents(events);
      const result = await playbackEngine.generateSandboxPlayback(options);

      if (result.success && result.configPath && options.mode === 'windows-sandbox') {
        const launched = await playbackEngine.launchWindowsSandbox(result.configPath);
        if (!launched) {
          result.message += ' (Windows Sandbox launch failed - please open the .wsb file manually)';
        }
      }

      context.mainWindow?.webContents.send('playback:started', result);
      return result;
    } catch (error) {
      return {
        success: false,
        mode: options.mode,
        scriptPath: '',
        outputPath: '',
        message: `Playback generation failed: ${(error as Error).message}`,
      };
    }
  });

  ipcMain.handle('playback:stop', async (): Promise<boolean> => {
    try {
      context.mainWindow?.webContents.send('playback:stopped');
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('playback:status', async (): Promise<{ sandbox: boolean; vmware: boolean }> => {
    try {
      const { playbackEngine } = await import('../playback/player');
      return playbackEngine.checkSandboxAvailable();
    } catch {
      return { sandbox: false, vmware: false };
    }
  });

  ipcMain.handle('playback:generate-script', async (_, events: HIDInputEvent[], options: SandboxPlaybackOptions): Promise<SandboxPlaybackResult> => {
    try {
      const { playbackEngine } = await import('../playback/player');
      playbackEngine.loadEvents(events);
      return await playbackEngine.generateSandboxPlayback(options);
    } catch (error) {
      return {
        success: false,
        mode: options.mode,
        scriptPath: '',
        outputPath: '',
        message: `Script generation failed: ${(error as Error).message}`,
      };
    }
  });

  ipcMain.handle(
    'virustotal:scan-file',
    async (_, filePath: string): Promise<VirusTotalScanResult | null> => {
      try {
        const settings = db.getSettings();
        if (!settings.virustotal.apiKey) {
          return null;
        }

        const fileContent = await fs.readFile(filePath);
        const formData = new FormData();
        formData.append('file', new Blob([fileContent]), path.basename(filePath));

        const response = await axios.post('https://www.virustotal.com/api/v3/files', formData, {
          headers: {
            'x-apikey': settings.virustotal.apiKey,
            'Content-Type': 'multipart/form-data',
          },
        });

        const scanId = response.data.data.id;

        const scanResult: Omit<VirusTotalScanResult, 'id'> = {
          scanId,
          permalink: `https://www.virustotal.com/gui/file/${scanId}`,
          positives: 0,
          total: 0,
          detectionRate: 0,
          scans: {},
          scanDate: new Date(),
        };

        db.addVTScan(scanResult);
        return scanResult as VirusTotalScanResult;
      } catch {
        return null;
      }
    }
  );

  ipcMain.handle(
    'virustotal:get-scan',
    async (_, scanId: string): Promise<VirusTotalScanResult | null> => {
      return db.getVTScanByScanId(scanId);
    }
  );

  ipcMain.handle('virustotal:get-scans', async (): Promise<VirusTotalScanResult[]> => {
    return db.getAllVTScan();
  });

  ipcMain.handle('signatures:get-all', async (): Promise<AttackSignature[]> => {
    return db.getAllSignatures();
  });

  ipcMain.handle('signatures:get-by-id', async (_, id: number): Promise<AttackSignature | null> => {
    return db.getSignatureById(id);
  });

  ipcMain.handle(
    'signatures:create',
    async (_, signature: Omit<AttackSignature, 'id'>): Promise<number> => {
      return db.addSignature(signature);
    }
  );

  ipcMain.handle(
    'signatures:update',
    async (_, id: number, updates: Partial<Omit<AttackSignature, 'id' | 'signatureId'>>) => {
      try {
        db.updateSignature(id, updates);
        return true;
      } catch {
        return false;
      }
    }
  );

  ipcMain.handle('signatures:delete', async (_, id: number): Promise<boolean> => {
    try {
      db.deleteSignature(id);
      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle(
    'signatures:load-from-file',
    async (_, filePath: string): Promise<{ success: boolean; count: number }> => {
      try {
        const count = await context.signatureEngine.loadFromFile(filePath);
        const signatures = context.signatureEngine.getSignatures();
        for (const sig of signatures) {
          const existing = db.getSignatureBySignatureId(sig.signatureId);
          if (!existing) {
            db.addSignature(sig);
          }
        }
        return { success: true, count };
      } catch {
        return { success: false, count: 0 };
      }
    }
  );

  ipcMain.handle('settings:get', async (): Promise<AppSettings> => {
    return db.getSettings();
  });

  ipcMain.handle('settings:update', async (_, settings: Partial<AppSettings>): Promise<boolean> => {
    try {
      db.updateSettings(settings);

      if (settings.detection) {
        context.analyzer.updateConfig({
          minTypingSpeedThreshold: settings.detection.minTypingSpeedThreshold,
          shortcutDensityThreshold: settings.detection.shortcutDensityThreshold,
          shortcutTimeWindowMs: settings.detection.shortcutTimeWindowMs,
          minInputIntervalVariance: settings.detection.minInputIntervalVariance,
          mouseEdgeDetection: settings.detection.mouseEdgeDetection,
        });
      }

      return true;
    } catch {
      return false;
    }
  });

  ipcMain.handle('app:get-version', async (): Promise<string> => {
    return process.env.npm_package_version || '1.0.0';
  });
}

export function cleanupIPC(): void {
  ipcMain.removeHandler('dsl:parse');
  ipcMain.removeHandler('dsl:compile');
  ipcMain.removeHandler('dsl:templates');
  ipcMain.removeHandler('dsl:template:apply');
  ipcMain.removeHandler('detection:start');
  ipcMain.removeHandler('detection:stop');
  ipcMain.removeHandler('detection:status');
  ipcMain.removeHandler('detection:devices');
  ipcMain.removeHandler('events:query');
  ipcMain.removeHandler('events:get');
  ipcMain.removeHandler('events:delete');
  ipcMain.removeHandler('events:export');
  ipcMain.removeHandler('service:install');
  ipcMain.removeHandler('service:uninstall');
  ipcMain.removeHandler('service:start');
  ipcMain.removeHandler('service:stop');
  ipcMain.removeHandler('service:status');
  ipcMain.removeHandler('service:config:set');
  ipcMain.removeHandler('playback:start');
  ipcMain.removeHandler('playback:stop');
  ipcMain.removeHandler('playback:status');
  ipcMain.removeHandler('playback:generate-script');
  ipcMain.removeHandler('virustotal:scan-file');
  ipcMain.removeHandler('virustotal:get-scans');
  ipcMain.removeHandler('signatures:get-all');
  ipcMain.removeHandler('signatures:get-by-id');
  ipcMain.removeHandler('signatures:create');
  ipcMain.removeHandler('signatures:update');
  ipcMain.removeHandler('signatures:delete');
  ipcMain.removeHandler('signatures:load-from-file');
  ipcMain.removeHandler('settings:get');
  ipcMain.removeHandler('settings:update');
  ipcMain.removeHandler('app:get-version');
}

export function cleanupAll(): void {
  if (context.hidListener) {
    context.hidListener.destroy();
    context.hidListener = null;
  }

  context.analyzer.clearBuffer();
  context.signatureEngine.clearSignatures();
  cleanupIPC();
}

export default initializeIPC;
