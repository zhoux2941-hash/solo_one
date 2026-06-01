const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('terminalAPI', {
  usb: {
    getDevices: () => ipcRenderer.invoke('usb:get-devices'),
    connectDevice: (deviceId) => ipcRenderer.invoke('usb:connect-device', deviceId),
    simulateConnect: () => ipcRenderer.invoke('usb:simulate-connect'),
    simulateDisconnect: () => ipcRenderer.invoke('usb:simulate-disconnect'),
    onDeviceConnected: (callback) => {
      ipcRenderer.on('usb:device-connected', (e, data) => callback(data));
    },
    onDeviceDisconnected: (callback) => {
      ipcRenderer.on('usb:device-disconnected', (e, data) => callback(data));
    }
  },

  fingerprint: {
    capture: (options) => ipcRenderer.invoke('fingerprint:capture', options),
    verify: (templateId, fingerprintData) => 
      ipcRenderer.invoke('fingerprint:verify', templateId, fingerprintData),
    listTemplates: () => ipcRenderer.invoke('fingerprint:list-templates'),
    deleteTemplate: (templateId) => ipcRenderer.invoke('fingerprint:delete-template', templateId),
    listUsers: () => ipcRenderer.invoke('fingerprint:list-users'),
    selectAndCapture: (userId) => ipcRenderer.invoke('fingerprint:select-and-capture', userId),
    setSimulationMode: (enabled) => ipcRenderer.invoke('fingerprint:set-simulation-mode', enabled)
  },

  payment: {
    getHistory: (limit) => ipcRenderer.invoke('payment:get-history', limit),
    simulateRequest: (amount) => ipcRenderer.invoke('payment:simulate-request', amount),
    confirmFingerprint: (paymentId, userId) => 
      ipcRenderer.invoke('payment:confirm-fingerprint', paymentId, userId),
    cancel: (paymentId) => ipcRenderer.invoke('payment:cancel', paymentId),
    onStatus: (callback) => {
      ipcRenderer.on('payment:status', (e, data) => callback(data));
    }
  },

  printer: {
    list: () => ipcRenderer.invoke('printer:list'),
    printReceipt: (paymentId) => ipcRenderer.invoke('printer:print-receipt', paymentId),
    generatePDF: (paymentId) => ipcRenderer.invoke('printer:generate-pdf', paymentId)
  },

  offline: {
    getPending: () => ipcRenderer.invoke('offline:get-pending'),
    retryAll: () => ipcRenderer.invoke('offline:retry-all')
  },

  app: {
    getStatus: () => ipcRenderer.invoke('app:get-status'),
    onNetworkStatus: (callback) => {
      ipcRenderer.on('network:status', (e, data) => callback(data));
    }
  }
});
