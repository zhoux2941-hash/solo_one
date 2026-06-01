import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import WebSocket from 'ws';

let mainWindow: BrowserWindow | null = null;
let ws: WebSocket | null = null;
const WS_URL = 'ws://127.0.0.1:9877';

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 900,
    title: 'CAN-REID: CAN Bus Reverse Engineering & Intrusion Detection',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    backgroundColor: '#0d1117',
    show: false,
  });

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:9000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function connectWebSocket() {
  ws = new WebSocket(WS_URL);

  ws.on('open', () => {
    mainWindow?.webContents.send('ws-status', { connected: true });
  });

  ws.on('message', (data: WebSocket.Data) => {
    try {
      const msg = JSON.parse(data.toString());
      mainWindow?.webContents.send('ws-message', msg);
    } catch (e) {
      console.error('Failed to parse WS message:', e);
    }
  });

  ws.on('close', () => {
    mainWindow?.webContents.send('ws-status', { connected: false });
    setTimeout(connectWebSocket, 3000);
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
}

function sendToBackend(msg: object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

ipcMain.on('ws-send', (_event, msg) => {
  sendToBackend(msg);
});

app.whenReady().then(() => {
  createWindow();
  connectWebSocket();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
