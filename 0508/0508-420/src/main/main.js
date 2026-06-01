const { app, BrowserWindow, ipcMain, dialog, Notification } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const initSqlJs = require('sql.js');

let mainWindow;
let db;
let SQL;

async function initDatabase() {
  SQL = await initSqlJs();
  const dbPath = path.join(app.getPath('userData'), 'p2p-fileshare.db');
  
  let data = null;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    data = new Uint8Array(fileBuffer);
  }
  
  db = new SQL.Database(data);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS nodes (
      id TEXT PRIMARY KEY,
      name TEXT,
      ip TEXT,
      port INTEGER,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS transfers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      peer_id TEXT,
      peer_name TEXT,
      file_name TEXT,
      file_size INTEGER,
      file_path TEXT,
      status TEXT,
      progress INTEGER DEFAULT 0,
      speed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS transfer_chunks (
      transfer_id INTEGER NOT NULL,
      chunk_index INTEGER NOT NULL,
      PRIMARY KEY (transfer_id, chunk_index),
      FOREIGN KEY (transfer_id) REFERENCES transfers(id)
    );
  `);
  
  saveDatabase();
}

function saveDatabase() {
  const dbPath = path.join(app.getPath('userData'), 'p2p-fileshare.db');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-local-ip', () => {
  return getLocalIP();
});

ipcMain.handle('get-hostname', () => {
  return os.hostname();
});

ipcMain.handle('select-save-path', async (event, fileName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: '保存文件',
    defaultPath: fileName
  });
  return result.filePath;
});

ipcMain.handle('select-files', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: '所有文件', extensions: ['*'] }]
  });
  return result.filePaths;
});

ipcMain.handle('db-save-transfer', (event, transfer) => {
  const stmt = db.prepare(`
    INSERT INTO transfers (type, peer_id, peer_name, file_name, file_size, file_path, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run([
    transfer.type,
    transfer.peerId,
    transfer.peerName,
    transfer.fileName,
    transfer.fileSize,
    transfer.filePath,
    transfer.status
  ]);
  saveDatabase();
  return db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
});

ipcMain.handle('db-update-transfer', (event, id, data) => {
  const updates = [];
  const values = [];
  if (data.status !== undefined) { updates.push('status = ?'); values.push(data.status); }
  if (data.progress !== undefined) { updates.push('progress = ?'); values.push(data.progress); }
  if (data.speed !== undefined) { updates.push('speed = ?'); values.push(data.speed); }
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  const stmt = db.prepare(`UPDATE transfers SET ${updates.join(', ')} WHERE id = ?`);
  stmt.run(values);
  saveDatabase();
});

ipcMain.handle('db-get-transfers', () => {
  const result = db.exec('SELECT * FROM transfers ORDER BY created_at DESC');
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
});

ipcMain.handle('db-get-transfer', (event, id) => {
  const result = db.exec('SELECT * FROM transfers WHERE id = ?', [id]);
  if (result.length === 0) return null;
  const columns = result[0].columns;
  const row = result[0].values[0];
  const obj = {};
  columns.forEach((col, i) => obj[col] = row[i]);
  return obj;
});

ipcMain.handle('db-save-node', (event, node) => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO nodes (id, name, ip, port, last_seen)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  stmt.run([node.id, node.name, node.ip, node.port]);
  saveDatabase();
});

ipcMain.handle('db-get-nodes', () => {
  const result = db.exec('SELECT * FROM nodes ORDER BY last_seen DESC');
  if (result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    columns.forEach((col, i) => obj[col] = row[i]);
    return obj;
  });
});

ipcMain.handle('show-notification', (event, title, body) => {
  new Notification({ title, body }).show();
});

ipcMain.handle('read-file-chunk', (event, filePath, start, length) => {
  const buffer = Buffer.alloc(length);
  const fd = fs.openSync(filePath, 'r');
  fs.readSync(fd, buffer, 0, length, start);
  fs.closeSync(fd);
  return buffer.toString('base64');
});

ipcMain.handle('write-file-chunk', (event, filePath, data, position) => {
  const buffer = Buffer.from(data, 'base64');
  const fd = fs.openSync(filePath, 'r+');
  fs.writeSync(fd, buffer, 0, buffer.length, position);
  fs.closeSync(fd);
});

ipcMain.handle('create-file', (event, filePath, size) => {
  const fd = fs.openSync(filePath, 'w');
  fs.ftruncateSync(fd, size);
  fs.closeSync(fd);
});

ipcMain.handle('get-file-size', (event, filePath) => {
  return fs.statSync(filePath).size;
});

ipcMain.handle('file-exists', (event, filePath) => {
  return fs.existsSync(filePath);
});

ipcMain.handle('db-save-chunk', (event, transferId, chunkIndex) => {
  const stmt = db.prepare('INSERT OR IGNORE INTO transfer_chunks (transfer_id, chunk_index) VALUES (?, ?)');
  stmt.run([transferId, chunkIndex]);
  saveDatabase();
});

ipcMain.handle('db-get-completed-chunks', (event, transferId) => {
  const result = db.exec('SELECT chunk_index FROM transfer_chunks WHERE transfer_id = ?', [transferId]);
  if (result.length === 0) return [];
  return result[0].values.map(row => row[0]);
});

ipcMain.handle('db-clear-chunks', (event, transferId) => {
  const stmt = db.prepare('DELETE FROM transfer_chunks WHERE transfer_id = ?');
  stmt.run([transferId]);
  saveDatabase();
});

ipcMain.handle('db-batch-save-chunks', (event, transferId, chunkIndices) => {
  const stmt = db.prepare('INSERT OR IGNORE INTO transfer_chunks (transfer_id, chunk_index) VALUES (?, ?)');
  for (const idx of chunkIndices) {
    stmt.run([transferId, idx]);
  }
  saveDatabase();
});

ipcMain.handle('db-reset-transfer-for-retry', (event, transferId) => {
  const stmt = db.prepare('DELETE FROM transfer_chunks WHERE transfer_id = ?');
  stmt.run([transferId]);
  const updateStmt = db.prepare('UPDATE transfers SET status = ?, progress = 0, speed = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
  updateStmt.run(['pending', transferId]);
  saveDatabase();
});
