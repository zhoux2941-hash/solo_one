export interface SSHConnection {
  id: string;
  name: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  createdAt: number;
  lastUsed?: number;
}

export interface TerminalTab {
  id: string;
  connectionId: string;
  title: string;
  connected: boolean;
}

export interface ConnectionMessage {
  type: 'connect' | 'data' | 'resize' | 'disconnect';
  config?: any;
  data?: string;
  cols?: number;
  rows?: number;
}

export interface ServerMessage {
  type: 'connected' | 'data' | 'error' | 'disconnected';
  sessionId?: string;
  data?: string;
  message?: string;
}

export interface CommandSnippet {
  id: string;
  name: string;
  command: string;
  description?: string;
  category?: string;
  createdAt: number;
  lastUsed?: number;
  useCount: number;
}
