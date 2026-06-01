const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  reader: {
    getStatus: () => ipcRenderer.invoke('reader:get-status'),
    init: () => ipcRenderer.invoke('reader:init')
  },

  card: {
    getInfo: () => ipcRenderer.invoke('card:get-info'),
    analyze: (uid) => ipcRenderer.invoke('card:analyze', uid),
    readAll: (uid) => ipcRenderer.invoke('card:read-all', uid),
    dumpJson: (uid, outputPath) => ipcRenderer.invoke('card:dump-json', uid, outputPath)
  },

  crack: {
    start: (data) => ipcRenderer.invoke('crack:start', data),
    bruteForce: (data) => ipcRenderer.invoke('crack:bruteforce', data),
    stop: () => ipcRenderer.invoke('crack:stop')
  },

  emulate: {
    start: (data) => ipcRenderer.invoke('emulate:start', data),
    stop: () => ipcRenderer.invoke('emulate:stop'),
    switch: (data) => ipcRenderer.invoke('emulate:switch', data),
    status: () => ipcRenderer.invoke('emulate:status'),
    recordAccess: (data) => ipcRenderer.invoke('emulate:record-access', data)
  },

  cards: {
    getAll: () => ipcRenderer.invoke('cards:get-all'),
    get: (uid) => ipcRenderer.invoke('cards:get', uid),
    add: (cardInfo) => ipcRenderer.invoke('cards:add', cardInfo),
    updateName: (data) => ipcRenderer.invoke('cards:update-name', data),
    delete: (uid) => ipcRenderer.invoke('cards:delete', uid),
    setActive: (uid) => ipcRenderer.invoke('cards:set-active', uid),
    getActive: () => ipcRenderer.invoke('cards:get-active'),
    import: (dumpData) => ipcRenderer.invoke('cards:import', dumpData),
    export: (uid) => ipcRenderer.invoke('cards:export', uid)
  },

  report: {
    getStats: (data) => ipcRenderer.invoke('report:get-stats', data),
    generatePDF: (data) => ipcRenderer.invoke('report:generate-pdf', data),
    generateSummary: (data) => ipcRenderer.invoke('report:generate-summary', data)
  },

  logs: {
    get: (data) => ipcRenderer.invoke('logs:get', data),
    getByType: (data) => ipcRenderer.invoke('logs:get-by-type', data)
  },

  audit: {
    getRecords: (data) => ipcRenderer.invoke('audit:get-records', data)
  },

  keys: {
    getByUid: (uid) => ipcRenderer.invoke('keys:get-by-uid', uid),
    save: (keyData) => ipcRenderer.invoke('keys:save', keyData)
  },

  sectors: {
    getByUid: (uid) => ipcRenderer.invoke('sectors:get-by-uid', uid)
  },

  dialog: {
    saveFile: (options) => ipcRenderer.invoke('dialog:save-file', options),
    openFile: (options) => ipcRenderer.invoke('dialog:open-file', options)
  },

  fs: {
    readFile: (filePath) => ipcRenderer.invoke('fs:read-file', filePath),
    writeFile: (filePath, data) => ipcRenderer.invoke('fs:write-file', filePath, data)
  },

  monitor: {
    start: () => ipcRenderer.send('monitor:start'),
    stop: () => ipcRenderer.send('monitor:stop')
  },

  on: (channel, callback) => {
    const validChannels = [
      'card-detected',
      'card-removed',
      'card-can-emulate',
      'reader-connected',
      'reader-disconnected',
      'reader-error',
      'analyze:progress',
      'read:progress',
      'crack:progress'
    ];
    
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    }
  },

  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  }
});
