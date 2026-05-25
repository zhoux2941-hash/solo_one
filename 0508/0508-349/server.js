const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = 3000;
const DB_FILE = './heritage_restoration.db';

app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

let db;
let SQL;

async function initDatabase() {
  SQL = await initSqlJs();
  
  let dbData;
  if (fs.existsSync(DB_FILE)) {
    dbData = fs.readFileSync(DB_FILE);
    db = new SQL.Database(dbData);
  } else {
    db = new SQL.Database();
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      submitter TEXT,
      reviewer TEXT,
      submitted_at DATETIME,
      reviewed_at DATETIME,
      rework_count INTEGER DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      file_path TEXT NOT NULL,
      description TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      uploaded_by TEXT,
      FOREIGN KEY (process_id) REFERENCES processes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rework_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      reason TEXT NOT NULL,
      reviewer TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (process_id) REFERENCES processes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS process_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_id INTEGER NOT NULL,
      version INTEGER NOT NULL,
      status TEXT NOT NULL,
      submitter TEXT,
      reviewer TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (process_id) REFERENCES processes(id)
    )
  `);

  const countResult = db.exec('SELECT COUNT(*) as count FROM projects')[0];
  const count = countResult ? countResult.values[0][0] : 0;
  
  if (count === 0) {
    const defaultProcesses = ['清洗', '拼接', '补配', '封存'];
    const stmt = db.prepare('INSERT INTO projects (name, description) VALUES (?, ?)');
    stmt.run(['青铜鼎修复项目', '商周时期青铜鼎的修复工作']);
    stmt.free();
    
    const projectResult = db.exec('SELECT last_insert_rowid() as id FROM projects')[0];
    const projectId = projectResult.values[0][0];
    
    const processStmt = db.prepare('INSERT INTO processes (project_id, name, order_index, status) VALUES (?, ?, ?, ?)');
    for (let i = 0; i < defaultProcesses.length; i++) {
      processStmt.run([projectId, defaultProcesses[i], i, i === 0 ? 'ready' : 'pending']);
    }
    processStmt.free();
  }
  
  saveDatabase();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  const columns = stmt.getColumnNames();
  
  while (stmt.step()) {
    const row = stmt.get();
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = row[i];
    });
    results.push(obj);
  }
  
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params);
  return results[0] || null;
}

function runQuery(sql, params = []) {
  db.run(sql, params);
  saveDatabase();
  return { lastID: db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] };
}

app.get('/api/projects', async (req, res) => {
  try {
    const projects = queryAll('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = runQuery('INSERT INTO projects (name, description) VALUES (?, ?)', [name, description]);
    const projectId = result.lastID;
    
    const defaultProcesses = ['清洗', '拼接', '补配', '封存'];
    for (let i = 0; i < defaultProcesses.length; i++) {
      runQuery(
        'INSERT INTO processes (project_id, name, order_index, status) VALUES (?, ?, ?, ?)',
        [projectId, defaultProcesses[i], i, i === 0 ? 'ready' : 'pending']
      );
    }
    
    res.json({ id: projectId, name, description });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:projectId/processes', async (req, res) => {
  try {
    const { projectId } = req.params;
    const processes = queryAll(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM photos WHERE process_id = p.id) as photo_count,
        (SELECT COUNT(*) FROM rework_records WHERE process_id = p.id) as rework_record_count
      FROM processes p 
      WHERE p.project_id = ? 
      ORDER BY p.order_index ASC
    `, [projectId]);
    
    for (const process of processes) {
      process.photos = queryAll('SELECT * FROM photos WHERE process_id = ? ORDER BY version DESC', [process.id]);
      process.reworkRecords = queryAll('SELECT * FROM rework_records WHERE process_id = ? ORDER BY created_at DESC', [process.id]);
    }
    
    res.json(processes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/processes/:processId/submit', async (req, res) => {
  try {
    const { processId } = req.params;
    const { submitter, notes } = req.body;
    
    const process = queryOne('SELECT * FROM processes WHERE id = ?', [processId]);
    if (!process) {
      return res.status(404).json({ error: '工序不存在' });
    }
    if (process.status !== 'ready') {
      return res.status(400).json({ error: '当前工序不可提交' });
    }
    
    runQuery(`
      UPDATE processes 
      SET status = 'submitted', submitter = ?, notes = ?, submitted_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [submitter, notes, processId]);
    
    const versionResult = queryOne('SELECT MAX(version) as max_version FROM process_history WHERE process_id = ?', [processId]);
    const version = (versionResult?.max_version || 0) + 1;
    
    runQuery(`
      INSERT INTO process_history (process_id, version, status, submitter, notes)
      VALUES (?, ?, 'submitted', ?, ?)
    `, [processId, version, submitter, notes]);
    
    const updatedProcess = queryOne('SELECT * FROM processes WHERE id = ?', [processId]);
    res.json(updatedProcess);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/processes/:processId/review', async (req, res) => {
  try {
    const { processId } = req.params;
    const { reviewer, approved, reason } = req.body;
    
    const process = queryOne('SELECT * FROM processes WHERE id = ?', [processId]);
    if (!process) {
      return res.status(404).json({ error: '工序不存在' });
    }
    if (process.status !== 'submitted') {
      return res.status(400).json({ error: '当前工序不可审核' });
    }
    
    if (approved) {
      runQuery(`
        UPDATE processes 
        SET status = 'completed', reviewer = ?, reviewed_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `, [reviewer, processId]);
      
      const nextProcess = queryOne(`
        SELECT * FROM processes 
        WHERE project_id = ? AND order_index > ? 
        ORDER BY order_index ASC LIMIT 1
      `, [process.project_id, process.order_index]);
      
      if (nextProcess) {
        runQuery("UPDATE processes SET status = 'ready' WHERE id = ?", [nextProcess.id]);
      }
    } else {
      runQuery(`
        UPDATE processes 
        SET status = 'rework', reviewer = ?, rework_count = rework_count + 1 
        WHERE id = ?
      `, [reviewer, processId]);
      
      runQuery(`
        INSERT INTO rework_records (process_id, reason, reviewer) 
        VALUES (?, ?, ?)
      `, [processId, reason, reviewer]);
      
      const subsequentProcesses = queryAll(`
        SELECT * FROM processes 
        WHERE project_id = ? AND order_index > ? 
        ORDER BY order_index ASC
      `, [process.project_id, process.order_index]);
      
      for (const subProcess of subsequentProcesses) {
        if (subProcess.status !== 'pending') {
          runQuery("UPDATE processes SET status = 'pending' WHERE id = ?", [subProcess.id]);
        }
      }
    }
    
    const updatedProcess = queryOne('SELECT * FROM processes WHERE id = ?', [processId]);
    res.json(updatedProcess);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/processes/:processId/resubmit', async (req, res) => {
  try {
    const { processId } = req.params;
    const { notes } = req.body;
    
    const process = queryOne('SELECT * FROM processes WHERE id = ?', [processId]);
    if (!process) {
      return res.status(404).json({ error: '工序不存在' });
    }
    if (process.status !== 'rework') {
      return res.status(400).json({ error: '当前工序不可重新提交' });
    }
    
    runQuery("UPDATE processes SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP WHERE id = ?", [processId]);
    
    const versionResult = queryOne('SELECT MAX(version) as max_version FROM process_history WHERE process_id = ?', [processId]);
    const version = (versionResult?.max_version || 0) + 1;
    
    runQuery(`
      INSERT INTO process_history (process_id, version, status, submitter, notes)
      VALUES (?, ?, 'submitted', ?, ?)
    `, [processId, version, process.submitter, notes || process.notes]);
    
    const updatedProcess = queryOne('SELECT * FROM processes WHERE id = ?', [processId]);
    res.json(updatedProcess);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects/:projectId/reorder', async (req, res) => {
  try {
    const { projectId } = req.params;
    const { processIds } = req.body;
    
    for (let i = 0; i < processIds.length; i++) {
      runQuery('UPDATE processes SET order_index = ? WHERE id = ?', [i, processIds[i]]);
    }
    
    const processes = queryAll('SELECT * FROM processes WHERE project_id = ? ORDER BY order_index ASC', [projectId]);
    let foundIncomplete = false;
    
    for (const p of processes) {
      if (foundIncomplete && p.status !== 'pending') {
        runQuery("UPDATE processes SET status = 'pending' WHERE id = ?", [p.id]);
      }
      if (!foundIncomplete && p.status !== 'completed') {
        foundIncomplete = true;
        if (p.status === 'pending') {
          runQuery("UPDATE processes SET status = 'ready' WHERE id = ?", [p.id]);
        }
      }
    }
    
    const updatedProcesses = queryAll(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM photos WHERE process_id = p.id) as photo_count,
        (SELECT COUNT(*) FROM rework_records WHERE process_id = p.id) as rework_record_count
      FROM processes p 
      WHERE p.project_id = ? 
      ORDER BY p.order_index ASC
    `, [projectId]);
    
    for (const process of updatedProcesses) {
      process.photos = queryAll('SELECT * FROM photos WHERE process_id = ? ORDER BY version DESC', [process.id]);
      process.reworkRecords = queryAll('SELECT * FROM rework_records WHERE process_id = ? ORDER BY created_at DESC', [process.id]);
    }
    
    res.json(updatedProcesses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/processes/:processId/photos', upload.single('photo'), async (req, res) => {
  try {
    const { processId } = req.params;
    const { description, uploadedBy } = req.body;
    
    const existingPhotos = queryOne('SELECT MAX(version) as max_version FROM photos WHERE process_id = ?', [processId]);
    const version = (existingPhotos?.max_version || 0) + 1;
    
    const result = runQuery(`
      INSERT INTO photos (process_id, version, file_path, description, uploaded_by)
      VALUES (?, ?, ?, ?, ?)
    `, [processId, version, req.file.filename, description, uploadedBy]);
    
    const photo = queryOne('SELECT * FROM photos WHERE id = ?', [result.lastID]);
    res.json(photo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/processes/:processId/photos', async (req, res) => {
  try {
    const { processId } = req.params;
    const photos = queryAll('SELECT * FROM photos WHERE process_id = ? ORDER BY version DESC', [processId]);
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:projectId/rework-summary', async (req, res) => {
  try {
    const { projectId } = req.params;
    const summary = queryAll(`
      SELECT 
        p.name,
        p.rework_count,
        COUNT(r.id) as record_count
      FROM processes p
      LEFT JOIN rework_records r ON p.id = r.process_id
      WHERE p.project_id = ?
      GROUP BY p.id
      ORDER BY p.order_index ASC
    `, [projectId]);
    
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/processes/:processId/history', async (req, res) => {
  try {
    const { processId } = req.params;
    const history = queryAll(`
      SELECT h.*, p.name as process_name
      FROM process_history h
      JOIN processes p ON h.process_id = p.id
      WHERE h.process_id = ?
      ORDER BY h.version DESC
    `, [processId]);
    
    for (const record of history) {
      record.photos = queryAll('SELECT * FROM photos WHERE process_id = ? ORDER BY version DESC', [processId]);
    }
    
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:projectId/rework-weekly', async (req, res) => {
  try {
    const { projectId } = req.params;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const reworkData = queryAll(`
      SELECT 
        p.name as process_name,
        p.id as process_id,
        r.reason,
        r.reviewer,
        r.created_at
      FROM rework_records r
      JOIN processes p ON r.process_id = p.id
      WHERE p.project_id = ? AND r.created_at >= ?
      ORDER BY r.created_at DESC
    `, [projectId, sevenDaysAgo]);
    
    const processStats = {};
    reworkData.forEach(record => {
      if (!processStats[record.process_name]) {
        processStats[record.process_name] = {
          process_id: record.process_id,
          count: 0,
          reasons: []
        };
      }
      processStats[record.process_name].count++;
      processStats[record.process_name].reasons.push({
        reason: record.reason,
        reviewer: record.reviewer,
        created_at: record.created_at
      });
    });
    
    const sortedStats = Object.entries(processStats)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);
    
    res.json({
      total: reworkData.length,
      byProcess: sortedStats,
      details: reworkData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('数据库初始化失败:', err);
});
