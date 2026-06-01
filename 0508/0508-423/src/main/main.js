const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const Database = require('./database');
const WebSocketServer = require('./websocket');
const USBDeviceManager = require('./usb-manager');
const FingerprintManager = require('./fingerprint');
const PaymentProcessor = require('./payment');
const PrinterManager = require('./printer');
const OfflineManager = require('./offline-manager');

class TerminalApplication {
  constructor() {
    this.mainWindow = null;
    this.db = null;
    this.wsServer = null;
    this.usbManager = null;
    this.fingerprintManager = null;
    this.paymentProcessor = null;
    this.printerManager = null;
    this.offlineManager = null;
    this.isDev = process.argv.includes('--dev');
  }

  async initialize() {
    app.on('ready', () => this.onReady());
    app.on('window-all-closed', () => this.onWindowAllClosed());
    app.on('activate', () => this.onActivate());

    this.setupSecurityPolicies();
  }

  setupSecurityPolicies() {
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  }

  async onReady() {
    this.db = new Database(path.join(app.getPath('userData'), 'terminal.db'));
    await this.db.initialize();

    this.usbManager = new USBDeviceManager(this.db, this.isDev);
    this.fingerprintManager = new FingerprintManager(this.db);
    this.printerManager = new PrinterManager(this.db);
    this.offlineManager = new OfflineManager(this.db);
    this.paymentProcessor = new PaymentProcessor(
      this.db,
      this.fingerprintManager,
      this.printerManager,
      this.offlineManager
    );
    this.offlineManager.setPaymentProcessor(this.paymentProcessor);

    this.wsServer = new WebSocketServer(8080, this.paymentProcessor, this.usbManager);
    this.wsServer.start();

    this.setupIPC();
    this.createWindow();

    this.usbManager.startMonitoring();
    this.offlineManager.startRetryLoop();

    this.usbManager.on('device-connected', (device) => {
      this.sendToRenderer('usb:device-connected', device);
      this.wsServer.broadcast({
        jsonrpc: '2.0',
        method: 'device_connected',
        params: { device }
      });
    });

    this.usbManager.on('device-disconnected', (device) => {
      this.sendToRenderer('usb:device-disconnected', device);
      this.wsServer.broadcast({
        jsonrpc: '2.0',
        method: 'device_disconnected',
        params: { device }
      });
    });

    this.paymentProcessor.on('payment-status', (status) => {
      this.sendToRenderer('payment:status', status);
    });

    this.offlineManager.on('network-status', (online) => {
      this.sendToRenderer('network:status', { online });
      this.wsServer.broadcast({
        jsonrpc: '2.0',
        method: 'network_status',
        params: { online }
      });
    });

    const { webContents } = this.mainWindow;
    session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
      if (permission === 'usb') {
        callback(true);
      } else {
        callback(false);
      }
    });
  }

  setupIPC() {
    ipcMain.handle('usb:get-devices', () => this.usbManager.getDevices());
    ipcMain.handle('usb:connect-device', (e, deviceId) => this.usbManager.connectDevice(deviceId));
    ipcMain.handle('usb:simulate-connect', () => this.usbManager.simulateDeviceConnect());
    ipcMain.handle('usb:simulate-disconnect', () => this.usbManager.simulateDeviceDisconnect());

    ipcMain.handle('fingerprint:capture', (e, options) => this.fingerprintManager.captureFingerprint(options));
    ipcMain.handle('fingerprint:verify', (e, templateId, fingerprintData) => 
      this.fingerprintManager.verifyFingerprint(templateId, fingerprintData));
    ipcMain.handle('fingerprint:list-templates', () => this.fingerprintManager.listTemplates());
    ipcMain.handle('fingerprint:delete-template', (e, templateId) => 
      this.fingerprintManager.deleteTemplate(templateId));
    ipcMain.handle('fingerprint:list-users', () => this.fingerprintManager.listUsersWithFingerprints());
    ipcMain.handle('fingerprint:select-and-capture', (e, userId) => 
      this.fingerprintManager.selectAndCapture(userId));
    ipcMain.handle('fingerprint:set-simulation-mode', (e, enabled) => 
      this.fingerprintManager.setSimulationMode(enabled));

    ipcMain.handle('payment:get-history', (e, limit) => this.paymentProcessor.getHistory(limit));
    ipcMain.handle('payment:simulate-request', (e, amount) => 
      this.paymentProcessor.simulatePaymentRequest(amount));
    ipcMain.handle('payment:confirm-fingerprint', (e, paymentId, userId) => 
      this.paymentProcessor.confirmFingerprint(paymentId, userId));
    ipcMain.handle('payment:cancel', (e, paymentId) => this.paymentProcessor.cancelPayment(paymentId));

    ipcMain.handle('printer:list', () => this.printerManager.listPrinters());
    ipcMain.handle('printer:print-receipt', (e, paymentId) => 
      this.printerManager.printReceipt(paymentId));
    ipcMain.handle('printer:generate-pdf', (e, paymentId) => 
      this.printerManager.generateReceiptPDF(paymentId));

    ipcMain.handle('offline:get-pending', () => this.offlineManager.getPendingPayments());
    ipcMain.handle('offline:retry-all', () => this.offlineManager.retryAllPending());

    ipcMain.handle('app:get-status', () => ({
      usbDevices: this.usbManager.getDevices(),
      isOnline: this.offlineManager.isOnline(),
      pendingCount: this.offlineManager.getPendingCount(),
      fingerprintCount: this.fingerprintManager.getTemplateCount(),
      wsPort: this.wsServer.port
    }));
  }

  createWindow() {
    this.mainWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 900,
      minHeight: 600,
      backgroundColor: '#1a1a2e',
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false,
        webSecurity: true
      }
    });

    this.mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));

    if (this.isDev) {
      this.mainWindow.webContents.openDevTools();
    }

    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });
  }

  onWindowAllClosed() {
    if (process.platform !== 'darwin') {
      this.cleanup();
      app.quit();
    }
  }

  onActivate() {
    if (this.mainWindow === null) {
      this.createWindow();
    }
  }

  sendToRenderer(channel, data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, data);
    }
  }

  cleanup() {
    if (this.wsServer) this.wsServer.stop();
    if (this.usbManager) this.usbManager.stopMonitoring();
    if (this.offlineManager) this.offlineManager.stopRetryLoop();
    if (this.db) this.db.close();
  }
}

const terminalApp = new TerminalApplication();
terminalApp.initialize();
