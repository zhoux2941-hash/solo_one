const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getBrands: () => ipcRenderer.invoke('get-brands'),
  getPaintTypes: () => ipcRenderer.invoke('get-paint-types'),
  getPaints: (brandId, typeId) => ipcRenderer.invoke('get-paints', brandId, typeId),
  getPaintById: (id) => ipcRenderer.invoke('get-paint-by-id', id),
  savePreference: (paintId, ratioPaint, ratioThinner) => 
    ipcRenderer.invoke('save-preference', paintId, ratioPaint, ratioThinner),
  deletePreference: (paintId) => ipcRenderer.invoke('delete-preference', paintId),
  addMixingRecord: (data) => ipcRenderer.invoke('add-mixing-record', data),
  getHistory: (limit) => ipcRenderer.invoke('get-history', limit),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  getSprayGunSettings: () => ipcRenderer.invoke('get-spray-gun-settings'),
  updateSprayGunSetting: (paintTypeId, cleanIntervalMinutes) => 
    ipcRenderer.invoke('update-spray-gun-setting', paintTypeId, cleanIntervalMinutes),
  startSprayGunUsage: (paintTypeId) => ipcRenderer.invoke('start-spray-gun-usage', paintTypeId),
  endSprayGunUsage: (usageId, usageMinutes) => 
    ipcRenderer.invoke('end-spray-gun-usage', usageId, usageMinutes),
  markSprayGunCleaned: (usageId) => ipcRenderer.invoke('mark-spray-gun-cleaned', usageId),
  markAllSprayGunCleaned: () => ipcRenderer.invoke('mark-all-spray-gun-cleaned'),
  getSprayGunUsageStatus: () => ipcRenderer.invoke('get-spray-gun-usage-status'),
  getUncleanedUsage: () => ipcRenderer.invoke('get-uncleaned-usage')
});
