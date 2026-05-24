import { Client } from 'ssh2';
import type { SSHConfig, SSHSession } from './types.js';
import crypto from 'node:crypto';

const SEND_CHUNK_SIZE = 4096;
const SEND_INTERVAL = 5;

export class SSHManager {
  private sessions: Map<string, SSHSession> = new Map();

  generateId(): string {
    return crypto.randomUUID();
  }

  private createBufferedSender(onData: (data: string) => void): (data: string) => void {
    let buffer = '';
    let timeout: NodeJS.Timeout | null = null;

    const flushBuffer = () => {
      if (buffer.length === 0) {
        timeout = null;
        return;
      }

      const chunk = buffer.slice(0, SEND_CHUNK_SIZE);
      buffer = buffer.slice(SEND_CHUNK_SIZE);
      onData(chunk);

      if (buffer.length > 0) {
        timeout = setTimeout(flushBuffer, SEND_INTERVAL);
      } else {
        timeout = null;
      }
    };

    return (data: string) => {
      buffer += data;
      
      if (!timeout) {
        if (buffer.length <= SEND_CHUNK_SIZE) {
          onData(buffer);
          buffer = '';
        } else {
          flushBuffer();
        }
      }
    };
  }

  async createSession(
    config: SSHConfig,
    onData: (data: string) => void
  ): Promise<string> {
    const id = this.generateId();
    const client = new Client();
    const bufferedSend = this.createBufferedSender(onData);

    return new Promise((resolve, reject) => {
      client.on('ready', () => {
        client.shell({
          term: 'xterm-256color',
          cols: 120,
          rows: 40
        }, (err, stream) => {
          if (err) {
            client.end();
            reject(err);
            return;
          }

          stream.on('data', (chunk: Buffer) => {
            bufferedSend(chunk.toString('utf8'));
          });

          stream.on('close', () => {
            client.end();
            this.sessions.delete(id);
          });

          stream.stderr.on('data', (chunk: Buffer) => {
            bufferedSend(chunk.toString('utf8'));
          });

          this.sessions.set(id, {
            id,
            config,
            client,
            shell: stream,
            onData
          });

          resolve(id);
        });
      });

      client.on('error', (err) => {
        reject(err);
      });

      const connectConfig: any = {
        host: config.host,
        port: config.port || 22,
        username: config.username,
        readyTimeout: 30000
      };

      if (config.password) {
        connectConfig.password = config.password;
      } else if (config.privateKey) {
        connectConfig.privateKey = config.privateKey;
      }

      client.connect(connectConfig);
    });
  }

  async sendData(sessionId: string, data: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.shell) {
      session.shell.write(data);
    }
  }

  async resize(sessionId: string, cols: number, rows: number): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session && session.shell) {
      session.shell.setWindow(rows, cols);
    }
  }

  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.shell) {
        session.shell.end();
      }
      session.client.end();
      this.sessions.delete(sessionId);
    }
  }

  getSession(sessionId: string): SSHSession | undefined {
    return this.sessions.get(sessionId);
  }
}
