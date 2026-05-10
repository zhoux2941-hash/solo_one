const { app, BrowserWindow, ipcMain, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const initSqlJs = require('sql.js');

let db;
let SQL;
let mainWindow;
let dbPath;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'snippets.db');
}

function saveDatabase() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

async function initDatabase() {
  dbPath = getDbPath();
  SQL = await initSqlJs();
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS snippets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'javascript',
      code TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS snippet_tags (
      snippet_id INTEGER,
      tag_id INTEGER,
      PRIMARY KEY (snippet_id, tag_id)
    );
  `);
  
  saveDatabase();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  mainWindow.loadFile('index.html');
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
  if (db) {
    saveDatabase();
    db.close();
  }
  if (process.platform !== 'darwin') {
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
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function execute(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
}

ipcMain.handle('snippets:getAll', () => {
  const snippets = queryAll(`
    SELECT s.*, 
           GROUP_CONCAT(t.name) as tags 
    FROM snippets s
    LEFT JOIN snippet_tags st ON s.id = st.snippet_id
    LEFT JOIN tags t ON st.tag_id = t.id
    GROUP BY s.id
    ORDER BY s.updated_at DESC
  `);
  
  return snippets.map(s => ({
    ...s,
    tags: s.tags ? s.tags.split(',').filter(Boolean) : []
  }));
});

ipcMain.handle('snippets:getById', (event, id) => {
  const snippet = queryOne(`
    SELECT s.*, 
           GROUP_CONCAT(t.name) as tags 
    FROM snippets s
    LEFT JOIN snippet_tags st ON s.id = st.snippet_id
    LEFT JOIN tags t ON st.tag_id = t.id
    WHERE s.id = ?
    GROUP BY s.id
  `, [id]);
  
  if (snippet) {
    return {
      ...snippet,
      tags: snippet.tags ? snippet.tags.split(',').filter(Boolean) : []
    };
  }
  return null;
});

ipcMain.handle('snippets:create', (event, { title, language, code, tags }) => {
  execute(
    'INSERT INTO snippets (title, language, code) VALUES (?, ?, ?)',
    [title, language || 'javascript', code]
  );
  
  const snippetId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
  
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const existingTag = queryOne('SELECT id FROM tags WHERE name = ?', [tag]);
      let tagId;
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        execute('INSERT INTO tags (name) VALUES (?)', [tag]);
        tagId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      }
      
      execute('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)', [snippetId, tagId]);
    }
  }
  
  return snippetId;
});

ipcMain.handle('snippets:update', (event, { id, title, language, code, tags }) => {
  execute(
    'UPDATE snippets SET title = ?, language = ?, code = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [title, language || 'javascript', code, id]
  );
  
  execute('DELETE FROM snippet_tags WHERE snippet_id = ?', [id]);
  
  if (tags && tags.length > 0) {
    for (const tag of tags) {
      const existingTag = queryOne('SELECT id FROM tags WHERE name = ?', [tag]);
      let tagId;
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        execute('INSERT INTO tags (name) VALUES (?)', [tag]);
        tagId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
      }
      
      execute('INSERT INTO snippet_tags (snippet_id, tag_id) VALUES (?, ?)', [id, tagId]);
    }
  }
  
  return true;
});

ipcMain.handle('snippets:delete', (event, id) => {
  execute('DELETE FROM snippets WHERE id = ?', [id]);
  execute('DELETE FROM snippet_tags WHERE snippet_id = ?', [id]);
  execute(`
    DELETE FROM tags WHERE id NOT IN (SELECT tag_id FROM snippet_tags)
  `);
  return true;
});

ipcMain.handle('snippets:search', (event, query) => {
  const searchQuery = `%${query}%`;
  
  const matchedSnippets = queryAll(`
    SELECT DISTINCT s.id
    FROM snippets s
    LEFT JOIN snippet_tags st ON s.id = st.snippet_id
    LEFT JOIN tags t ON st.tag_id = t.id
    WHERE s.title LIKE ? 
       OR s.code LIKE ? 
       OR s.language LIKE ?
       OR t.name LIKE ?
  `, [searchQuery, searchQuery, searchQuery, searchQuery]);
  
  const snippetIds = matchedSnippets.map(s => s.id);
  
  if (snippetIds.length === 0) {
    return [];
  }
  
  const placeholders = snippetIds.map(() => '?').join(',');
  
  const snippets = queryAll(`
    SELECT s.*, 
           GROUP_CONCAT(t.name) as tags 
    FROM snippets s
    LEFT JOIN snippet_tags st ON s.id = st.snippet_id
    LEFT JOIN tags t ON st.tag_id = t.id
    WHERE s.id IN (${placeholders})
    GROUP BY s.id
    ORDER BY s.updated_at DESC
  `, snippetIds);
  
  return snippets.map(s => ({
    ...s,
    tags: s.tags ? s.tags.split(',').filter(Boolean) : []
  }));
});

ipcMain.handle('tags:getAll', () => {
  const tags = queryAll('SELECT name FROM tags ORDER BY name');
  return tags.map(t => t.name);
});

ipcMain.handle('snippets:getByTag', (event, tagName) => {
  const snippets = queryAll(`
    SELECT s.*, 
           GROUP_CONCAT(t2.name) as tags 
    FROM snippets s
    JOIN snippet_tags st1 ON s.id = st1.snippet_id
    JOIN tags t1 ON st1.tag_id = t1.id AND t1.name = ?
    LEFT JOIN snippet_tags st2 ON s.id = st2.snippet_id
    LEFT JOIN tags t2 ON st2.tag_id = t2.id
    GROUP BY s.id
    ORDER BY s.updated_at DESC
  `, [tagName]);
  
  return snippets.map(s => ({
    ...s,
    tags: s.tags ? s.tags.split(',').filter(Boolean) : []
  }));
});

ipcMain.handle('clipboard:copy', (event, text) => {
  clipboard.writeText(text);
  return true;
});

function findPythonPath() {
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      return cmd;
    } catch (e) {}
  }
  return null;
}

ipcMain.handle('code:run', async (event, { language, code }) => {
  return new Promise((resolve) => {
    const tempDir = app.getPath('temp');
    const timestamp = Date.now();
    
    let command;
    let args = [];
    let tempFile;
    
    if (language === 'javascript' || language === 'typescript') {
      tempFile = path.join(tempDir, `snippet_${timestamp}.js`);
      fs.writeFileSync(tempFile, code);
      command = process.execPath;
      args = [tempFile];
    } else if (language === 'python') {
      const pythonCmd = findPythonPath();
      if (!pythonCmd) {
        resolve({
          success: false,
          output: '',
          error: '未找到 Python 环境，请先安装 Python 并确保已添加到系统 PATH'
        });
        return;
      }
      tempFile = path.join(tempDir, `snippet_${timestamp}.py`);
      fs.writeFileSync(tempFile, code);
      command = pythonCmd;
      args = [tempFile];
    } else {
      resolve({
        success: false,
        output: '',
        error: `不支持运行 ${language} 代码，仅支持 JavaScript 和 Python`
      });
      return;
    }
    
    let output = '';
    let errorOutput = '';
    const startTime = Date.now();
    
    try {
      const child = spawn(command, args, {
        timeout: 10000,
        maxBuffer: 1024 * 1024,
        env: process.env
      });
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      child.on('error', (err) => {
        if (tempFile && fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch (e) {}
        }
        resolve({
          success: false,
          output: output,
          error: `执行错误: ${err.message}`
        });
      });
      
      child.on('close', (code) => {
        if (tempFile && fs.existsSync(tempFile)) {
          try { fs.unlinkSync(tempFile); } catch (e) {}
        }
        
        const duration = Date.now() - startTime;
        
        if (code === 0) {
          resolve({
            success: true,
            output: output,
            error: errorOutput,
            duration: duration
          });
        } else {
          resolve({
            success: false,
            output: output,
            error: errorOutput || `进程退出，退出码: ${code}`,
            duration: duration
          });
        }
      });
      
      const timeoutId = setTimeout(() => {
        try {
          child.kill('SIGTERM');
          if (tempFile && fs.existsSync(tempFile)) {
            try { fs.unlinkSync(tempFile); } catch (e) {}
          }
          resolve({
            success: false,
            output: output,
            error: '执行超时（超过 10 秒）',
            duration: Date.now() - startTime
          });
        } catch (e) {}
      }, 10000);
      
      child.on('close', () => clearTimeout(timeoutId));
      
    } catch (err) {
      if (tempFile && fs.existsSync(tempFile)) {
        try { fs.unlinkSync(tempFile); } catch (e) {}
      }
      resolve({
        success: false,
        output: output,
        error: `错误: ${err.message}`
      });
    }
  });
});
