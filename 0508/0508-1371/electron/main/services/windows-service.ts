import { Service } from 'node-windows';
import path from 'path';
import { app } from 'electron';
import type { WindowsServiceStatus } from '@shared/types';

interface ServiceConfig {
  name: string;
  description: string;
  scriptPath: string;
  nodePath?: string;
}

class WindowsServiceManager {
  private service: Service | null = null;
  private config: ServiceConfig;
  private eventHandlers: Map<string, (...args: any[]) => void> = new Map();

  constructor(config?: Partial<ServiceConfig>) {
    const defaultScriptPath = app
      ? path.join(app.getPath('exe'), '..', 'resources', 'app.asar', 'dist-electron', 'main', 'service.js')
      : path.join(process.cwd(), 'dist-electron', 'main', 'service.js');

    this.config = {
      name: config?.name || 'HIDAttackFramework',
      description: config?.description || 'HID Attack Framework Background Service',
      scriptPath: config?.scriptPath || defaultScriptPath,
      nodePath: config?.nodePath,
    };
  }

  private initService(): Service {
    if (this.service) return this.service;

    this.service = new Service({
      name: this.config.name,
      description: this.config.description,
      script: this.config.scriptPath,
      nodeOptions: this.config.nodePath ? ['--execPath', this.config.nodePath] : [],
      env: [
        { name: 'NODE_ENV', value: 'production' },
      ],
    });

    const installHandler = () => {
      console.log(`Service ${this.config.name} installed successfully`);
    };
    this.eventHandlers.set('install', installHandler);
    this.service.on('install', installHandler);

    const uninstallHandler = () => {
      console.log(`Service ${this.config.name} uninstalled successfully`);
    };
    this.eventHandlers.set('uninstall', uninstallHandler);
    this.service.on('uninstall', uninstallHandler);

    const startHandler = () => {
      console.log(`Service ${this.config.name} started`);
    };
    this.eventHandlers.set('start', startHandler);
    this.service.on('start', startHandler);

    const stopHandler = () => {
      console.log(`Service ${this.config.name} stopped`);
    };
    this.eventHandlers.set('stop', stopHandler);
    this.service.on('stop', stopHandler);

    const errorHandler = (error: Error) => {
      console.error(`Service error: ${error.message}`);
    };
    this.eventHandlers.set('error', errorHandler);
    this.service.on('error', errorHandler);

    return this.service;
  }

  destroy(): void {
    if (this.service) {
      for (const [eventName, handler] of this.eventHandlers) {
        this.service.removeListener(eventName, handler);
      }
      this.eventHandlers.clear();
      this.service = null;
    }
  }

  async install(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const service = this.initService();
      
      service.once('install', () => resolve(true));
      service.once('error', (err: Error) => reject(err));
      
      service.install();
    });
  }

  async uninstall(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const service = this.initService();
      
      service.once('uninstall', () => {
        this.service = null;
        resolve(true);
      });
      service.once('error', (err: Error) => reject(err));
      
      service.uninstall();
    });
  }

  async start(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const service = this.initService();
      
      service.once('start', () => resolve(true));
      service.once('error', (err: Error) => reject(err));
      
      service.start();
    });
  }

  async stop(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const service = this.initService();
      
      service.once('stop', () => resolve(true));
      service.once('error', (err: Error) => reject(err));
      
      service.stop();
    });
  }

  async restart(): Promise<boolean> {
    await this.stop();
    return this.start();
  }

  async setAutoStart(enabled: boolean): Promise<boolean> {
    const service = this.initService();
    
    if (enabled) {
      service.startOnBoot = true;
      return true;
    } else {
      service.startOnBoot = false;
      return true;
    }
  }

  getStatus(): WindowsServiceStatus {
    const service = this.initService();
    const isInstalled = service.exists;
    const isRunning = service.running;

    return {
      installed: isInstalled,
      running: isRunning,
      autoStart: isInstalled && service.startOnBoot,
      processId: isRunning ? (service.pid ?? undefined) : undefined,
      lastStart: isRunning ? new Date() : undefined,
      logPath: path.join(
        process.env.SystemRoot || 'C:\\Windows',
        'System32',
        'LogFiles',
        'HIDAttackFramework'
      ),
    };
  }

  getLogs(): string[] {
    const logDir = path.join(
      process.env.SystemRoot || 'C:\\Windows',
      'System32',
      'LogFiles',
      'HIDAttackFramework'
    );
    
    try {
      const fs = require('fs-extra');
      if (fs.existsSync(logDir)) {
        return fs.readdirSync(logDir).filter((file: string) => file.endsWith('.log'));
      }
      return [];
    } catch {
      return [];
    }
  }

  clearLogs(): boolean {
    const logDir = path.join(
      process.env.SystemRoot || 'C:\\Windows',
      'System32',
      'LogFiles',
      'HIDAttackFramework'
    );
    
    try {
      const fs = require('fs-extra');
      if (fs.existsSync(logDir)) {
        const files = fs.readdirSync(logDir).filter((file: string) => file.endsWith('.log'));
        for (const file of files) {
          fs.unlinkSync(path.join(logDir, file));
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export const windowsService = new WindowsServiceManager();
export default WindowsServiceManager;
