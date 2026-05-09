const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const windowManager = require('./window-manager')
const ipcHandlers = require('./ipc-handlers')

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  const mainWindow = windowManager.createMainWindow()
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'))
  }
  
  ipcHandlers.registerAllHandlers()
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})
