const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const fs = require('fs');
const { initDatabase, CardDB, LogDB, SectorDB, KeyDB, AuditDB } = require('./database');
const NFCReader = require('./nfc/reader');
const MifareAnalyzer = require('./nfc/mifareAnalyzer');
const NestedAuthCracker = require('./nfc/nestedAuthCracker');
const CardManager = require('./cardManager');
const AuditReportGenerator = require('./auditReport');

let mainWindow = null;
let nfcReader = null;
let mifareAnalyzer = null;
let keyCracker = null;
let cardManager = null;
let reportGenerator = null;
let monitorInterval = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      enableRemoteModule: false
    },
    icon: path.join(__dirname, '../../assets/icon.png')
  });

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

const initNFC = async () => {
  try {
    nfcReader = new NFCReader();
    const success = await nfcReader.init();

    if (success) {
      mifareAnalyzer = new MifareAnalyzer(nfcReader);
      keyCracker = new NestedAuthCracker(nfcReader);
      cardManager = new CardManager(nfcReader);
      reportGenerator = new AuditReportGenerator();

      nfcReader.on('card-detected', async (card) => {
        try {
          const cardInfo = {
            uid: card.uid,
            sak: card.sak.toString(16).padStart(2, '0'),
            atqa: card.atqa.toString('hex'),
            type: card.type || 'Mifare Classic 1K'
          };

          LogDB.addLog('card_detected', card.uid, cardInfo);

          const existingCard = CardDB.getCardByUid(card.uid);
          if (existingCard) {
            if (mainWindow) {
              mainWindow.webContents.send('card-can-emulate', cardInfo);
            }
            new Notification({
              title: 'NFC门禁卡系统',
              body: `检测到可模拟卡片\nUID: ${card.uid}\n名称: ${existingCard.name}`
            }).show();
          }

          if (mainWindow) {
            mainWindow.webContents.send('card-detected', cardInfo);
          }
        } catch (e) {
          console.error('处理卡检测事件失败:', e);
        }
      });

      nfcReader.on('card-removed', () => {
        if (mainWindow) {
          mainWindow.webContents.send('card-removed');
        }
      });

      nfcReader.on('reader-connected', (name) => {
        if (mainWindow) {
          mainWindow.webContents.send('reader-connected', name);
        }
      });

      nfcReader.on('reader-disconnected', (name) => {
        if (mainWindow) {
          mainWindow.webContents.send('reader-disconnected', name);
        }
      });

      nfcReader.on('reader-error', (error) => {
        if (mainWindow) {
          mainWindow.webContents.send('reader-error', error);
        }
      });
    }

    return success;
  } catch (error) {
    console.error('NFC初始化失败:', error);
    return false;
  }
};

const setupIPC = () => {
  ipcMain.handle('reader:get-status', async () => {
    return {
      readers: nfcReader ? nfcReader.getReaders() : [],
      currentReader: nfcReader?.currentReader?.reader?.name || null,
      isMonitoring: nfcReader?.isMonitoring || false,
      isEmulating: cardManager?.isEmulating || false
    };
  });

  ipcMain.handle('reader:init', async () => {
    return await initNFC();
  });

  ipcMain.handle('card:get-info', async () => {
    if (!nfcReader) throw new Error('读卡器未初始化');
    return await nfcReader.getCardInfo();
  });

  ipcMain.handle('card:analyze', async (event, uid) => {
    if (!mifareAnalyzer) throw new Error('分析器未初始化');
    
    const cardInfo = await nfcReader.getCardInfo();
    return await mifareAnalyzer.analyzeCard(cardInfo, (progress, sector, result) => {
      if (mainWindow) {
        mainWindow.webContents.send('analyze:progress', { progress, sector, result });
      }
    });
  });

  ipcMain.handle('card:read-all', async (event, uid) => {
    if (!mifareAnalyzer) throw new Error('分析器未初始化');
    return await mifareAnalyzer.readAllSectors(uid, (progress, sector, result) => {
      if (mainWindow) {
        mainWindow.webContents.send('read:progress', { progress, sector, result });
      }
    });
  });

  ipcMain.handle('card:dump-json', async (event, uid, outputPath) => {
    if (!mifareAnalyzer) throw new Error('分析器未初始化');
    return await mifareAnalyzer.dumpToJson(uid, outputPath);
  });

  ipcMain.handle('crack:start', async (event, { uid, sectorIndex, knownKey, knownKeyType, targetKeyType }) => {
    if (!keyCracker) throw new Error('破解器未初始化');
    return await keyCracker.crackSector(
      uid, sectorIndex, knownKey, knownKeyType, targetKeyType,
      (progress, checked, total) => {
        if (mainWindow) {
          mainWindow.webContents.send('crack:progress', { progress, checked, total, sectorIndex });
        }
      }
    );
  });

  ipcMain.handle('crack:bruteforce', async (event, { uid, sectorIndex, targetKeyType }) => {
    if (!keyCracker) throw new Error('破解器未初始化');
    return await keyCracker.bruteForceSector(uid, sectorIndex, targetKeyType,
      (progress, checked, total, currentKey) => {
        if (mainWindow) {
          mainWindow.webContents.send('crack:progress', { progress, checked, total, currentKey, sectorIndex });
        }
      }
    );
  });

  ipcMain.handle('crack:stop', async () => {
    if (keyCracker) {
      keyCracker.stop();
      return true;
    }
    return false;
  });

  ipcMain.handle('emulate:start', async (event, { uid, location }) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.startEmulation(uid, location);
  });

  ipcMain.handle('emulate:stop', async () => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.stopEmulation();
  });

  ipcMain.handle('emulate:switch', async (event, { uid, location }) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.switchEmulationCard(uid, location);
  });

  ipcMain.handle('emulate:status', async () => {
    if (!cardManager) return { isEmulating: false };
    return await cardManager.getEmulationStatus();
  });

  ipcMain.handle('emulate:record-access', async (event, { uid, readerId, location }) => {
    if (cardManager) {
      cardManager.recordReaderAccess(uid, readerId, location);
      return true;
    }
    return false;
  });

  ipcMain.handle('cards:get-all', async () => {
    if (!cardManager) return [];
    return await cardManager.getAllCards();
  });

  ipcMain.handle('cards:get', async (event, uid) => {
    if (!cardManager) return null;
    return await cardManager.getCardByUid(uid);
  });

  ipcMain.handle('cards:add', async (event, cardInfo) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.addCard(cardInfo);
  });

  ipcMain.handle('cards:update-name', async (event, { uid, name }) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.updateCardName(uid, name);
  });

  ipcMain.handle('cards:delete', async (event, uid) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.deleteCard(uid);
  });

  ipcMain.handle('cards:set-active', async (event, uid) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.setActiveCard(uid);
  });

  ipcMain.handle('cards:get-active', async () => {
    if (!cardManager) return null;
    return await cardManager.getActiveCard();
  });

  ipcMain.handle('cards:import', async (event, dumpData) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.importCardFromDump(dumpData);
  });

  ipcMain.handle('cards:export', async (event, uid) => {
    if (!cardManager) throw new Error('卡片管理器未初始化');
    return await cardManager.exportCardDump(uid);
  });

  ipcMain.handle('report:get-stats', async (event, { uid, startDate, endDate }) => {
    if (!reportGenerator) throw new Error('报表生成器未初始化');
    return reportGenerator.getAuditStatistics(uid, startDate, endDate);
  });

  ipcMain.handle('report:generate-pdf', async (event, { uid, startDate, endDate }) => {
    if (!reportGenerator) throw new Error('报表生成器未初始化');
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存审计报告',
      defaultPath: `audit_report_${uid}_${Date.now()}.pdf`,
      filters: [{ name: 'PDF文档', extensions: ['pdf'] }]
    });

    if (result.canceled) return null;
    
    return await reportGenerator.generatePDFReport(uid, startDate, endDate, result.filePath);
  });

  ipcMain.handle('report:generate-summary', async (event, { startDate, endDate }) => {
    if (!reportGenerator) throw new Error('报表生成器未初始化');
    
    const result = await dialog.showSaveDialog(mainWindow, {
      title: '保存汇总报告',
      defaultPath: `summary_report_${Date.now()}.pdf`,
      filters: [{ name: 'PDF文档', extensions: ['pdf'] }]
    });

    if (result.canceled) return null;
    
    return await reportGenerator.generateAllCardsReport(startDate, endDate, result.filePath);
  });

  ipcMain.handle('logs:get', async (event, { limit, offset }) => {
    return LogDB.getLogs(limit || 100, offset || 0);
  });

  ipcMain.handle('logs:get-by-type', async (event, { type, limit }) => {
    return LogDB.getLogsByType(type, limit || 100);
  });

  ipcMain.handle('audit:get-records', async (event, { uid, startDate, endDate }) => {
    return AuditDB.getRecordsByUid(uid, startDate, endDate);
  });

  ipcMain.handle('keys:get-by-uid', async (event, uid) => {
    return KeyDB.getKeysByUid(uid);
  });

  ipcMain.handle('keys:save', async (event, keyData) => {
    return KeyDB.saveKey(keyData);
  });

  ipcMain.handle('sectors:get-by-uid', async (event, uid) => {
    return SectorDB.getSectorsByUid(uid);
  });

  ipcMain.handle('dialog:save-file', async (event, options) => {
    const result = await dialog.showSaveDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('dialog:open-file', async (event, options) => {
    const result = await dialog.showOpenDialog(mainWindow, options);
    return result;
  });

  ipcMain.handle('fs:read-file', async (event, filePath) => {
    return fs.readFileSync(filePath, 'utf-8');
  });

  ipcMain.handle('fs:write-file', async (event, filePath, data) => {
    fs.writeFileSync(filePath, data);
    return true;
  });

  ipcMain.on('monitor:start', () => {
    if (nfcReader) {
      nfcReader.startMonitoring();
    }
  });

  ipcMain.on('monitor:stop', () => {
    if (nfcReader) {
      nfcReader.stopMonitoring();
    }
  });
};

app.whenReady().then(async () => {
  try {
    initDatabase();
    setupIPC();
    createWindow();

    await initNFC();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (error) {
    console.error('应用启动失败:', error);
  }
});

app.on('window-all-closed', async () => {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }

  if (cardManager && cardManager.isEmulating) {
    try {
      await cardManager.stopEmulation();
    } catch (e) {}
  }

  if (nfcReader) {
    try {
      await nfcReader.close();
    } catch (e) {}
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async (e) => {
  if (cardManager && cardManager.isEmulating) {
    try {
      await cardManager.stopEmulation();
    } catch (e) {}
  }
});
