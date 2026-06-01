type MessageHandler = (msg: any) => void;
type StatusHandler = (status: any) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private url = 'ws://127.0.0.1:9877';

  connect() {
    this.doConnect();
  }

  private doConnect() {
    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.statusHandlers.forEach(h => h({ connected: true }));
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.messageHandlers.forEach(h => h(msg));
        } catch (e) {
          console.error('Failed to parse message:', e);
        }
      };

      this.ws.onclose = () => {
        this.statusHandlers.forEach(h => h({ connected: false }));
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.statusHandlers.forEach(h => h({ connected: false }));
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.doConnect();
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  send(msg: object) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  onMessage(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  onStatus(handler: StatusHandler) {
    this.statusHandlers.push(handler);
  }
}
