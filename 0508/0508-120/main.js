const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { scanFolder, matchSubtitles, copyAndRenameSubtitle, batchRename, getHistory, setHistory, clearHistory, shiftSubtitleFile } = require('./utils/fileUtils');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();

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

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });

  if (result.canceled || result.filePaths.length === 0) {
    return { success: false, path: null };
  }

  return { success: true, path: result.filePaths[0] };
});

ipcMain.handle('scan-files', async (event, folderPath) => {
  try {
    const result = await scanFolder(folderPath);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('match-subtitles', async (event, { folderPath, videos, subtitles }) => {
  try {
    const result = await matchSubtitles(folderPath, videos, subtitles);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('copy-subtitle', async (event, { videoPath, subtitlePath, newName }) => {
  try {
    const result = await copyAndRenameSubtitle(videoPath, subtitlePath, newName);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('batch-rename', async (event, matches) => {
  try {
    const result = await batchRename(matches);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-history', async () => {
  try {
    const result = await getHistory();
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-history', async (event, key, value) => {
  try {
    await setHistory(key, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-history', async () => {
  try {
    await clearHistory();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-message', async (event, { type, title, message }) => {
  await dialog.showMessageBox(mainWindow, {
    type: type || 'info',
    title: title || '提示',
    message: message
  });
});

ipcMain.handle('shift-subtitle', async (event, { subtitlePath, offsetSeconds, outputPath }) => {
  try {
    const result = shiftSubtitleFile(subtitlePath, offsetSeconds, outputPath);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-save-path', async (event, { defaultName, filters }) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
    filters: filters || [
      { name: '字幕文件', extensions: ['srt', 'ass', 'ssa'] },
      { name: '所有文件', extensions: ['*'] }
    ]
  });

  if (result.canceled || !result.filePath) {
    return { success: false, path: null };
  }

  return { success: true, path: result.filePath };
});
