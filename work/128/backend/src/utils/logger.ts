export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO;

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  private getTimestamp(): string {
    return new Date().toISOString();
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[${this.getTimestamp()}] [DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.log(`[${this.getTimestamp()}] [INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.getTimestamp()}] [WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[${this.getTimestamp()}] [ERROR] ${message}`, ...args);
    }
  }

  logGame(roomId: string, message: string, ...args: any[]): void {
    this.info(`[Room:${roomId}] ${message}`, ...args);
  }

  logPlayer(roomId: string, playerId: string, message: string, ...args: any[]): void {
    this.info(`[Room:${roomId}] [Player:${playerId}] ${message}`, ...args);
  }
}

export const logger = new Logger();
