const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

let mainWindow;
let db;
let dbPath;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function saveDb() {
  if (!db || !dbPath) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initDatabase() {
  const SQL = await initSqlJs();
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'stories.db');

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      author TEXT,
      summary TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS character_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      age TEXT,
      appearance TEXT,
      personality TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS location_cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS plot_beats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
  `);

  saveDb();
}

app.whenReady().then(async () => {
  await initDatabase();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    saveDb();
    app.quit();
  }
});

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function runSql(sql, params = []) {
  db.run(sql, params);
  saveDb();
  const result = db.exec('SELECT last_insert_rowid() as id, changes() as changes');
  return {
    lastInsertRowid: result[0].values[0][0],
    changes: result[0].values[0][1],
  };
}

ipcMain.handle('get-all-projects', () => {
  return queryAll('SELECT * FROM projects ORDER BY created_at DESC');
});

ipcMain.handle('create-project', (event, { title, author, summary }) => {
  const result = runSql(
    'INSERT INTO projects (title, author, summary, created_at) VALUES (?, ?, ?, datetime("now"))',
    [title, author, summary]
  );
  return { id: result.lastInsertRowid };
});

ipcMain.handle('update-project', (event, { id, title, author, summary }) => {
  const result = runSql(
    'UPDATE projects SET title = ?, author = ?, summary = ? WHERE id = ?',
    [title, author, summary, id]
  );
  return { changes: result.changes };
});

ipcMain.handle('delete-project', (event, id) => {
  runSql('DELETE FROM character_cards WHERE project_id = ?', [id]);
  runSql('DELETE FROM location_cards WHERE project_id = ?', [id]);
  runSql('DELETE FROM plot_beats WHERE project_id = ?', [id]);
  const result = runSql('DELETE FROM projects WHERE id = ?', [id]);
  return { changes: result.changes };
});

ipcMain.handle('get-character-cards', (event, projectId) => {
  return queryAll('SELECT * FROM character_cards WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
});

ipcMain.handle('create-character-card', (event, { projectId, name, age, appearance, personality }) => {
  const result = runSql(
    'INSERT INTO character_cards (project_id, name, age, appearance, personality, created_at) VALUES (?, ?, ?, ?, ?, datetime("now"))',
    [projectId, name, age, appearance, personality]
  );
  return { id: result.lastInsertRowid };
});

ipcMain.handle('update-character-card', (event, { id, name, age, appearance, personality }) => {
  const result = runSql(
    'UPDATE character_cards SET name = ?, age = ?, appearance = ?, personality = ? WHERE id = ?',
    [name, age, appearance, personality, id]
  );
  return { changes: result.changes };
});

ipcMain.handle('delete-character-card', (event, id) => {
  const result = runSql('DELETE FROM character_cards WHERE id = ?', [id]);
  return { changes: result.changes };
});

ipcMain.handle('get-location-cards', (event, projectId) => {
  return queryAll('SELECT * FROM location_cards WHERE project_id = ? ORDER BY created_at DESC', [projectId]);
});

ipcMain.handle('create-location-card', (event, { projectId, name, description }) => {
  const result = runSql(
    'INSERT INTO location_cards (project_id, name, description, created_at) VALUES (?, ?, ?, datetime("now"))',
    [projectId, name, description]
  );
  return { id: result.lastInsertRowid };
});

ipcMain.handle('update-location-card', (event, { id, name, description }) => {
  const result = runSql(
    'UPDATE location_cards SET name = ?, description = ? WHERE id = ?',
    [name, description, id]
  );
  return { changes: result.changes };
});

ipcMain.handle('delete-location-card', (event, id) => {
  const result = runSql('DELETE FROM location_cards WHERE id = ?', [id]);
  return { changes: result.changes };
});

ipcMain.handle('get-plot-beats', (event, projectId) => {
  return queryAll('SELECT * FROM plot_beats WHERE project_id = ? ORDER BY sort_order ASC', [projectId]);
});

ipcMain.handle('create-plot-beat', (event, { projectId, title, content, sortOrder }) => {
  const result = runSql(
    'INSERT INTO plot_beats (project_id, title, content, sort_order, created_at) VALUES (?, ?, ?, ?, datetime("now"))',
    [projectId, title, content, sortOrder]
  );
  return { id: result.lastInsertRowid };
});

ipcMain.handle('update-plot-beat', (event, { id, title, content }) => {
  const result = runSql(
    'UPDATE plot_beats SET title = ?, content = ? WHERE id = ?',
    [title, content, id]
  );
  return { changes: result.changes };
});

ipcMain.handle('delete-plot-beat', (event, id) => {
  const result = runSql('DELETE FROM plot_beats WHERE id = ?', [id]);
  return { changes: result.changes };
});

ipcMain.handle('reorder-plot-beats', (event, { projectId, beats }) => {
  for (const beat of beats) {
    db.run('UPDATE plot_beats SET sort_order = ? WHERE id = ?', [beat.sortOrder, beat.id]);
  }
  saveDb();
  return { success: true };
});
