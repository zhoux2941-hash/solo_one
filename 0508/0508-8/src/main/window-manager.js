const { BrowserWindow, screen } = require('electron')
const path = require('path')

function createMainWindow() {
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  
  return new BrowserWindow({
    width: Math.min(1400, width * 0.9),
    height: Math.min(900, height * 0.9),
    minWidth: 1000,
    minHeight: 600,
    title: '素材归档检索工具',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    }
  })
}

function getMainWindow() {
  return BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0]
}

module.exports = {
  createMainWindow,
  getMainWindow
}
