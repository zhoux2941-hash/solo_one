import https from 'node:https';
import { WebSocketServer, WebSocket } from 'ws';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { SSHManager } from './ssh-manager.js';
import type { SSHConfig } from './types.js';
import path from 'node:path';

const PORT = 3001;

const certDir = path.join(process.cwd(), '.cert');
if (!existsSync(certDir)) {
  mkdirSync(certDir, { recursive: true });
}

let keyPath = path.join(certDir, 'key.pem');
let certPath = path.join(certDir, 'cert.pem');

if (!existsSync(keyPath) || !existsSync(certPath)) {
  console.log('Certificate files not found. Please generate them using:');
  console.log('openssl req -x509 -newkey rsa:2048 -keyout .cert/key.pem -out .cert/cert.pem -days 365 -nodes');
  console.log('Falling back to HTTP server...');
}

const options: https.ServerOptions = {};

try {
  if (existsSync(keyPath) && existsSync(certPath)) {
    options.key = readFileSync(keyPath);
    options.cert = readFileSync(certPath);
    console.log('Using HTTPS with certificates');
  }
} catch (e) {
  console.log('Could not load certificates, using HTTP');
}

const server = Object.keys(options).length > 0 
  ? https.createServer(options)
  : require('http').createServer();

const wss = new WebSocketServer({ server });

const sshManager = new SSHManager();

console.log('SSH Manager initialized');

wss.on('connection', (ws: WebSocket) => {
  console.log('New WebSocket connection');
  let sessionId: string | null = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Received message:', message.type);
      
      switch (message.type) {
        case 'connect':
          const config: SSHConfig = message.config;
          console.log('Connecting to:', config.host, config.port);
          try {
            sessionId = await sshManager.createSession(config, (output) => {
              ws.send(JSON.stringify({ type: 'data', data: output }));
            });
            console.log('Connected, sessionId:', sessionId);
            ws.send(JSON.stringify({ type: 'connected', sessionId }));
          } catch (err: any) {
            console.error('Connection error:', err.message);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: err.message || 'Connection failed' 
            }));
          }
          break;

        case 'data':
          if (sessionId) {
            await sshManager.sendData(sessionId, message.data);
          }
          break;

        case 'resize':
          if (sessionId) {
            await sshManager.resize(sessionId, message.cols, message.rows);
          }
          break;

        case 'disconnect':
          if (sessionId) {
            console.log('Disconnecting session:', sessionId);
            await sshManager.closeSession(sessionId);
            sessionId = null;
          }
          break;
      }
    } catch (error: any) {
      console.error('Message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: error.message || 'Unknown error' 
      }));
    }
  });

  ws.on('close', async () => {
    console.log('WebSocket closed');
    if (sessionId) {
      await sshManager.closeSession(sessionId);
    }
  });

  ws.on('error', async (error) => {
    console.error('WebSocket error:', error);
    if (sessionId) {
      await sshManager.closeSession(sessionId);
    }
  });
});

server.listen(PORT, () => {
  console.log(`WebSSH Server running on ${Object.keys(options).length > 0 ? 'https' : 'http'}://localhost:${PORT}`);
});
