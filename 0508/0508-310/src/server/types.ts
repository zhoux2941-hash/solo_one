export interface SSHConfig {
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
}

export interface SSHSession {
  id: string;
  config: SSHConfig;
  client: any;
  shell: any;
  onData: (data: string) => void;
}
