import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('canApi', {
  send: (msg: object) => ipcRenderer.send('ws-send', msg),
  onMessage: (callback: (msg: any) => void) => {
    ipcRenderer.on('ws-message', (_event, msg) => callback(msg));
  },
  onStatus: (callback: (status: any) => void) => {
    ipcRenderer.on('ws-status', (_event, status) => callback(status));
  },
  removeMessageListener: () => {
    ipcRenderer.removeAllListeners('ws-message');
  },
  removeStatusListener: () => {
    ipcRenderer.removeAllListeners('ws-status');
  },
});
