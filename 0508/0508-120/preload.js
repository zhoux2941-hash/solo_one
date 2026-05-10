const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  scanFiles: (folderPath) => ipcRenderer.invoke('scan-files', folderPath),
  matchSubtitles: (data) => ipcRenderer.invoke('match-subtitles', data),
  copySubtitle: (data) => ipcRenderer.invoke('copy-subtitle', data),
  batchRename: (matches) => ipcRenderer.invoke('batch-rename', matches),
  getHistory: () => ipcRenderer.invoke('get-history'),
  setHistory: (key, value) => ipcRenderer.invoke('set-history', key, value),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  showMessage: (data) => ipcRenderer.invoke('show-message', data),
  shiftSubtitle: (data) => ipcRenderer.invoke('shift-subtitle', data),
  selectSavePath: (data) => ipcRenderer.invoke('select-save-path', data)
});
