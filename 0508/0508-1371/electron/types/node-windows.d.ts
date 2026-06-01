declare module 'node-windows' {
  export class Service {
    constructor(options: {
      name: string;
      script: string;
      description?: string;
      nodeOptions?: string[];
      env?: { name: string; value: string }[];
      workingdirectory?: string;
    });
    
    on(event: string, callback: (...args: any[]) => void): void;
    once(event: string, callback: (...args: any[]) => void): void;
    removeListener(event: string, callback: (...args: any[]) => void): void;
    install(): void;
    uninstall(): void;
    start(): void;
    stop(): void;
    restart(): void;
    exists: boolean;
    running: boolean;
    status: number;
    pid: number | null;
    startOnBoot: boolean;
  }
  
  export const EventLogger: {
    new (name: string): {
      info(message: string): void;
      warn(message: string): void;
      error(message: string): void;
    };
  };
}
