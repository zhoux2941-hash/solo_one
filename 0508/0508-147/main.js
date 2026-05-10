const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1500,
    height: 950,
    minWidth: 1200,
    minHeight: 750,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  db.initDatabase();
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-brands', () => {
  return db.getBrands();
});

ipcMain.handle('get-paint-types', () => {
  return db.getPaintTypes();
});

ipcMain.handle('get-paints', (event, brandId, typeId) => {
  return db.getPaintsByBrandAndType(brandId, typeId);
});

ipcMain.handle('get-paint-by-id', (event, id) => {
  return db.getPaintById(id);
});

ipcMain.handle('save-preference', (event, paintId, ratioPaint, ratioThinner) => {
  return db.saveUserPreference(paintId, ratioPaint, ratioThinner);
});

ipcMain.handle('delete-preference', (event, paintId) => {
  return db.deleteUserPreference(paintId);
});

ipcMain.handle('add-mixing-record', (event, data) => {
  return db.addMixingRecord(data);
});

ipcMain.handle('get-history', (event, limit) => {
  return db.getMixingRecords(limit || 50);
});

ipcMain.handle('clear-history', () => {
  return db.clearMixingHistory();
});

ipcMain.handle('get-spray-gun-settings', () => {
  return db.getSprayGunSettings();
});

ipcMain.handle('update-spray-gun-setting', (event, paintTypeId, cleanIntervalMinutes) => {
  return db.updateSprayGunSetting(paintTypeId, cleanIntervalMinutes);
});

ipcMain.handle('start-spray-gun-usage', (event, paintTypeId) => {
  return db.startSprayGunUsage(paintTypeId);
});

ipcMain.handle('end-spray-gun-usage', (event, usageId, usageMinutes) => {
  return db.endSprayGunUsage(usageId, usageMinutes);
});

ipcMain.handle('mark-spray-gun-cleaned', (event, usageId) => {
  return db.markSprayGunCleaned(usageId);
});

ipcMain.handle('mark-all-spray-gun-cleaned', () => {
  return db.markAllSprayGunCleaned();
});

ipcMain.handle('get-spray-gun-usage-status', () => {
  return db.getSprayGunUsageStatus();
});

ipcMain.handle('get-uncleaned-usage', () => {
  return db.getUncleanedUsage();
});
