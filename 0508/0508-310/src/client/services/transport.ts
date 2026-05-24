import type { ConnectionMessage, ServerMessage } from '../types';

export class TransportService {
  private ws: WebSocket | null = null;
  private onMessage: ((message: ServerMessage) => void) | null = null;
  private onConnect: (() => void) | null = null;
  private onDisconnect: (() => void) | null = null;
  private onError: ((error: string) => void) | null = null;

  setOnMessage(handler: (message: ServerMessage) => void): void {
    this.onMessage = handler;
  }

  setOnConnect(handler: () => void): void {
    this.onConnect = handler;
  }

  setOnDisconnect(handler: () => void): void {
    this.onDisconnect = handler;
  }

  setOnError(handler: (error: string) => void): void {
    this.onError = handler;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//localhost:3001`;
        
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          this.onConnect?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.onMessage?.(message);
          } catch (e) {
            console.error('Failed to parse message:', e);
          }
        };

        this.ws.onclose = () => {
          this.onDisconnect?.();
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.onError?.('Connection error');
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  send(message: ConnectionMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const transportService = new TransportService();
