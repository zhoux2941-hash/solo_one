const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const userDataPath = process.env.APPDATA || 
  (process.platform === 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share');
const appDataDir = path.join(userDataPath, 'NFCAccessControl');

if (!fs.existsSync(appDataDir)) {
  fs.mkdirSync(appDataDir, { recursive: true });
}

const dbPath = path.join(appDataDir, 'nfc_cards.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initDatabase = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT UNIQUE NOT NULL,
      sak TEXT,
      atqa TEXT,
      card_type TEXT DEFAULT 'Mifare Classic 1K',
      name TEXT,
      is_active INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      sector_index INTEGER NOT NULL,
      block_data TEXT,
      key_a TEXT,
      key_b TEXT,
      access_conditions TEXT,
      is_encrypted INTEGER DEFAULT 0,
      is_cracked INTEGER DEFAULT 0,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE,
      UNIQUE(card_id, sector_index)
    );

    CREATE TABLE IF NOT EXISTS keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      uid TEXT NOT NULL,
      sector_index INTEGER NOT NULL,
      key_type TEXT CHECK(key_type IN ('A', 'B')),
      key_value TEXT NOT NULL,
      source TEXT DEFAULT 'cracked',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uid) REFERENCES cards(uid) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS operation_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_type TEXT NOT NULL,
      uid TEXT,
      details TEXT,
      operator TEXT DEFAULT 'system',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      card_id INTEGER NOT NULL,
      uid TEXT NOT NULL,
      action TEXT NOT NULL,
      reader_id TEXT,
      location TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (card_id) REFERENCES cards(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);

  const stmt = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cards'");
  if (stmt.get()) {
    console.log('[Database] 初始化完成');
  }
};

const CardDB = {
  addCard: (data) => {
    const { uid, sak, atqa, card_type, name } = data;
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO cards (uid, sak, atqa, card_type, name)
      VALUES (?, ?, ?, ?, ?)
    `);
    const result = stmt.run(uid, sak, atqa, card_type || 'Mifare Classic 1K', name || `卡-${uid}`);
    if (result.changes === 0) {
      const updateStmt = db.prepare(`
        UPDATE cards SET updated_at = CURRENT_TIMESTAMP WHERE uid = ?
      `);
      updateStmt.run(uid);
    }
    return db.prepare('SELECT * FROM cards WHERE uid = ?').get(uid);
  },

  getCardByUid: (uid) => {
    return db.prepare('SELECT * FROM cards WHERE uid = ?').get(uid);
  },

  getAllCards: () => {
    return db.prepare('SELECT * FROM cards ORDER BY updated_at DESC').all();
  },

  updateCardName: (uid, name) => {
    const stmt = db.prepare('UPDATE cards SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE uid = ?');
    return stmt.run(name, uid);
  },

  setActiveCard: (uid) => {
    db.prepare('UPDATE cards SET is_active = 0').run();
    const stmt = db.prepare('UPDATE cards SET is_active = 1 WHERE uid = ?');
    return stmt.run(uid);
  },

  getActiveCard: () => {
    return db.prepare('SELECT * FROM cards WHERE is_active = 1').get();
  },

  deleteCard: (uid) => {
    const stmt = db.prepare('DELETE FROM cards WHERE uid = ?');
    return stmt.run(uid);
  }
};

const SectorDB = {
  saveSector: (data) => {
    const { uid, sector_index, block_data, key_a, key_b, access_conditions, is_encrypted, is_cracked } = data;
    const card = CardDB.getCardByUid(uid);
    if (!card) return null;

    const stmt = db.prepare(`
      INSERT OR REPLACE INTO sectors 
      (card_id, sector_index, block_data, key_a, key_b, access_conditions, is_encrypted, is_cracked)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    return stmt.run(
      card.id, sector_index, 
      JSON.stringify(block_data || []), 
      key_a, key_b, access_conditions,
      is_encrypted ? 1 : 0, is_cracked ? 1 : 0
    );
  },

  getSectorsByUid: (uid) => {
    const card = CardDB.getCardByUid(uid);
    if (!card) return [];
    return db.prepare('SELECT * FROM sectors WHERE card_id = ? ORDER BY sector_index').all(card.id);
  },

  getSector: (uid, sector_index) => {
    const card = CardDB.getCardByUid(uid);
    if (!card) return null;
    return db.prepare('SELECT * FROM sectors WHERE card_id = ? AND sector_index = ?').get(card.id, sector_index);
  }
};

const KeyDB = {
  saveKey: (data) => {
    const { uid, sector_index, key_type, key_value, source } = data;
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO keys (uid, sector_index, key_type, key_value, source)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(uid, sector_index, key_type, key_value, source || 'cracked');
  },

  getKeysByUid: (uid) => {
    return db.prepare('SELECT * FROM keys WHERE uid = ? ORDER BY sector_index, key_type').all(uid);
  },

  getKey: (uid, sector_index, key_type) => {
    return db.prepare('SELECT * FROM keys WHERE uid = ? AND sector_index = ? AND key_type = ?').get(uid, sector_index, key_type);
  },

  getAllKeys: () => {
    return db.prepare('SELECT * FROM keys ORDER BY uid, sector_index').all();
  }
};

const LogDB = {
  addLog: (operation_type, uid, details, operator) => {
    const stmt = db.prepare(`
      INSERT INTO operation_logs (operation_type, uid, details, operator)
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(operation_type, uid, JSON.stringify(details || {}), operator || 'system');
  },

  getLogs: (limit = 100, offset = 0) => {
    return db.prepare(`
      SELECT * FROM operation_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
    `).all(limit, offset);
  },

  getLogsByType: (operation_type, limit = 100) => {
    return db.prepare(`
      SELECT * FROM operation_logs WHERE operation_type = ? ORDER BY created_at DESC LIMIT ?
    `).all(operation_type, limit);
  }
};

const AuditDB = {
  addRecord: (data) => {
    const { uid, action, reader_id, location } = data;
    const card = CardDB.getCardByUid(uid);
    if (!card) return null;

    const stmt = db.prepare(`
      INSERT INTO audit_records (card_id, uid, action, reader_id, location)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(card.id, uid, action, reader_id, location);
  },

  getRecordsByUid: (uid, startDate, endDate) => {
    let sql = 'SELECT * FROM audit_records WHERE uid = ?';
    const params = [uid];

    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }
    sql += ' ORDER BY timestamp DESC';

    return db.prepare(sql).all(...params);
  },

  getStatistics: (uid, startDate, endDate) => {
    let sql = `
      SELECT 
        action,
        COUNT(*) as count,
        DATE(timestamp) as date,
        strftime('%H', timestamp) as hour
      FROM audit_records 
      WHERE uid = ?
    `;
    const params = [uid];

    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }
    sql += " GROUP BY action, DATE(timestamp), strftime('%H', timestamp) ORDER BY date, hour";

    return db.prepare(sql).all(...params);
  },

  getUsageByLocation: (uid, startDate, endDate) => {
    let sql = `
      SELECT 
        location,
        reader_id,
        COUNT(*) as count
      FROM audit_records 
      WHERE uid = ? AND action = 'emulate'
    `;
    const params = [uid];

    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }
    sql += ' GROUP BY location, reader_id ORDER BY count DESC';

    return db.prepare(sql).all(...params);
  },

  getTimeDistribution: (uid, startDate, endDate) => {
    let sql = `
      SELECT 
        strftime('%H', timestamp) as hour,
        COUNT(*) as count
      FROM audit_records 
      WHERE uid = ? AND action = 'emulate'
    `;
    const params = [uid];

    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }
    sql += " GROUP BY strftime('%H', timestamp) ORDER BY hour";

    return db.prepare(sql).all(...params);
  },

  getHeatmapData: (uid, startDate, endDate) => {
    let sql = `
      SELECT 
        strftime('%w', timestamp) as day_of_week,
        strftime('%H', timestamp) as hour,
        COUNT(*) as count
      FROM audit_records 
      WHERE uid = ? AND action = 'emulate'
    `;
    const params = [uid];

    if (startDate) {
      sql += ' AND timestamp >= ?';
      params.push(startDate);
    }
    if (endDate) {
      sql += ' AND timestamp <= ?';
      params.push(endDate);
    }
    sql += " GROUP BY strftime('%w', timestamp), strftime('%H', timestamp)";

    return db.prepare(sql).all(...params);
  }
};

const SettingsDB = {
  get: (key) => {
    const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
    return row ? JSON.parse(row.value) : null;
  },
  set: (key, value) => {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO app_settings (key, value)
      VALUES (?, ?)
    `);
    return stmt.run(key, JSON.stringify(value));
  }
};

module.exports = {
  initDatabase,
  CardDB,
  SectorDB,
  KeyDB,
  LogDB,
  AuditDB,
  SettingsDB,
  db
};
