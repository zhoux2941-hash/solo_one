import { app, BrowserWindow, protocol, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './database/db';
import { SignatureEngine } from './detection/signatures';
import { initializeIPC, setMainWindow, cleanupAll } from './ipc/handlers';
import { playbackEngine } from './playback/player';
import { windowsService } from './services/windows-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';

let mainWindow: BrowserWindow | null = null;
let signatureEngine: SignatureEngine | null = null;

const isDev = process.env.NODE_ENV === 'development';
const viteDevServerUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173';

function createWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    title: 'HID Attack Framework',
    icon: path.join(process.cwd(), 'public', 'icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      preload: path.join(__dirname, 'preload', 'index.js'),
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
      devTools: isDev,
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#0f172a',
    show: false,
  });

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);
    if (parsedUrl.origin !== new URL(viteDevServerUrl).origin && !navigationUrl.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(navigationUrl);
    }
  });

  if (isDev) {
    mainWindow.loadURL(viteDevServerUrl);
    mainWindow.webContents.openDevTools({ mode: 'right' });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    mainWindow.loadFile(path.join(distPath, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

function initializeDatabase(): void {
  try {
    db.init();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

async function initializeSignatureEngine(): Promise<void> {
  try {
    signatureEngine = new SignatureEngine();

    const signaturesPath = path.join(__dirname, '..', 'main', 'signatures', 'default-signatures.yaml');
    try {
      const count = await signatureEngine.loadFromFile(signaturesPath);
      console.log(`Loaded ${count} default signatures`);
    } catch {
      console.log('No default signatures file found');
    }

    const dbSignatures = db.getAllSignatures();
    for (const sig of dbSignatures) {
      signatureEngine.addSignature(sig);
    }
    console.log(`Total signatures loaded: ${signatureEngine.getSignatureCount()}`);
  } catch (error) {
    console.error('Failed to initialize signature engine:', error);
  }
}

function registerProtocols(): void {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.replace('app://', '');
    const filePath = path.join(__dirname, '..', '..', url);
    callback({ path: filePath });
  });
}

function setupSecurityRestrictions(): void {
  app.on('web-contents-created', (_, contents) => {
    contents.on('will-attach-webview', (event) => {
      event.preventDefault();
    });
  });
}

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    registerProtocols();
    setupSecurityRestrictions();
    initializeDatabase();
    await initializeSignatureEngine();
    initializeIPC();

    const window = createWindow();
    setMainWindow(window);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        const win = createWindow();
        setMainWindow(win);
      }
    });
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', (event) => {
  console.log('Performing cleanup before quit...');

  try {
    cleanupAll();
    console.log('IPC and detectors cleaned');
  } catch (error) {
    console.error('Error cleaning up IPC:', error);
  }

  try {
    playbackEngine.destroy();
    console.log('Playback engine destroyed');
  } catch (error) {
    console.error('Error destroying playback engine:', error);
  }

  try {
    windowsService.destroy();
    console.log('Windows service manager destroyed');
  } catch (error) {
    console.error('Error destroying windows service manager:', error);
  }

  try {
    if (signatureEngine) {
      signatureEngine.clearSignatures();
      signatureEngine = null;
    }
    console.log('Signature engine cleared');
  } catch (error) {
    console.error('Error clearing signature engine:', error);
  }

  try {
    db.close();
    console.log('Database closed');
  } catch (error) {
    console.error('Error closing database:', error);
  }

  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('unhandledRejection');

  console.log('Cleanup complete');
});

app.on('quit', () => {
  console.log('Application quit');
});

app.on('certificate-error', (event, _, __, ___, ____, callback) => {
  event.preventDefault();
  callback(false);
});

app.on('select-client-certificate', (event, _, __, callback) => {
  event.preventDefault();
  (callback as unknown as () => void)();
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

export { mainWindow, signatureEngine };
export default app;
