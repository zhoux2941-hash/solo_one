export type MessageType = 'INPUT_CHANGE' | 'IO_STATE' | 'SIM_CONTROL' | 'SIM_STATE';

export class PlcWebSocket {
  private ws: WebSocket | null = null;
  private url: string = 'ws://localhost:8080/ws/plc';
  private messageHandlers: Map<MessageType, (data: any) => void> = new Map();

  connect(): void {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, payload } = message;
        const handler = this.messageHandlers.get(type as MessageType);
        if (handler) {
          handler(typeof payload === 'string' ? JSON.parse(payload) : payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(type: string, payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type,
          payload: JSON.stringify(payload),
        })
      );
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  on(type: MessageType, callback: (data: any) => void): void {
    this.messageHandlers.set(type, callback);
  }

  off(type: MessageType): void {
    this.messageHandlers.delete(type);
  }
}

export const plcWs = new PlcWebSocket();
