const initSqlJs = require('sql.js');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class TerminalDatabase {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.db = null;
    this.SQL = null;
  }

  async initialize() {
    this.SQL = await initSqlJs({
      locateFile: file => path.join(__dirname, '..', '..', 'node_modules', 'sql.js', 'dist', file)
    });

    if (fs.existsSync(this.dbPath)) {
      const fileBuffer = fs.readFileSync(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
    } else {
      this.db = new this.SQL.Database();
    }

    this.db.run('PRAGMA journal_mode = WAL');
    this.db.run('PRAGMA foreign_keys = ON');

    this.createTables();
    this.seedInitialData();
    this.save();
  }

  createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        full_name TEXT,
        card_number TEXT,
        balance REAL DEFAULT 10000.00,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS fingerprint_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        template_hash TEXT UNIQUE NOT NULL,
        template_data BLOB NOT NULL,
        finger_name TEXT,
        quality_score INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS usb_devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vendor_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        serial_number TEXT,
        manufacturer TEXT,
        product TEXT,
        device_path TEXT,
        is_virtual INTEGER DEFAULT 0,
        is_connected INTEGER DEFAULT 0,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(vendor_id, product_id, serial_number)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id TEXT UNIQUE NOT NULL,
        merchant_id TEXT,
        merchant_name TEXT,
        amount REAL NOT NULL,
        currency TEXT DEFAULT 'CNY',
        status TEXT NOT NULL DEFAULT 'pending',
        user_id INTEGER,
        fingerprint_template_id INTEGER,
        payment_method TEXT DEFAULT 'fingerprint',
        bank_response_code TEXT,
        bank_transaction_id TEXT,
        error_message TEXT,
        is_offline INTEGER DEFAULT 0,
        retry_count INTEGER DEFAULT 0,
        last_retry_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (fingerprint_template_id) REFERENCES fingerprint_templates(id)
      );

      CREATE TABLE IF NOT EXISTS receipts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER NOT NULL,
        receipt_data TEXT NOT NULL,
        pdf_path TEXT,
        printed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS pending_offline_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER NOT NULL,
        fingerprint_data BLOB,
        request_payload TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS transaction_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        payment_id INTEGER,
        action TEXT NOT NULL,
        status TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (payment_id) REFERENCES payments(id)
      );

      CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
      CREATE INDEX IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
      CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
      CREATE INDEX IF NOT EXISTS idx_fingerprints_user ON fingerprint_templates(user_id);
    `);
  }

  seedInitialData() {
    const userCount = this.queryOne('SELECT COUNT(*) as count FROM users').count;
    if (userCount === 0) {
      const users = [
        ['zhangsan', '张三', '6222021234567890123', 8500.50],
        ['lisi', '李四', '6222021234567890456', 12300.00],
        ['wangwu', '王五', '6222021234567890789', 3200.75]
      ];

      users.forEach(([username, fullName, cardNumber, balance]) => {
        this.run(
          'INSERT INTO users (username, full_name, card_number, balance) VALUES (?, ?, ?, ?)',
          [username, fullName, cardNumber, balance]
        );
      });

      for (let i = 1; i <= 3; i++) {
        const templateData = crypto.randomBytes(512);
        const templateHash = crypto.createHash('sha256').update(templateData).digest('hex');
        this.run(
          'INSERT INTO fingerprint_templates (user_id, template_hash, template_data, finger_name, quality_score) VALUES (?, ?, ?, ?, ?)',
          [i, templateHash, templateData, '右手拇指', 95 + i]
        );
      }
    }
  }

  prepare(sql) {
    const db = this.db;
    const self = this;
    
    return {
      run: function(...params) {
        db.run(sql, params);
        self.save();
        return {
          lastInsertRowid: db.exec('SELECT last_insert_rowid() as id')[0].values[0][0],
          changes: db.getRowsModified()
        };
      },
      get: function(...params) {
        const results = db.exec(sql, params);
        if (results.length === 0 || results[0].values.length === 0) return undefined;
        return self.rowToObject(results[0].columns, results[0].values[0]);
      },
      all: function(...params) {
        const results = db.exec(sql, params);
        if (results.length === 0) return [];
        return results[0].values.map(row => self.rowToObject(results[0].columns, row));
      }
    };
  }

  run(sql, params = []) {
    this.db.run(sql, params);
    this.save();
    return {
      lastInsertRowid: this.db.exec('SELECT last_insert_rowid() as id')[0].values[0][0],
      changes: this.db.getRowsModified()
    };
  }

  exec(sql) {
    this.db.exec(sql);
    this.save();
  }

  queryOne(sql, params = []) {
    const results = this.db.exec(sql, params);
    if (results.length === 0 || results[0].values.length === 0) return undefined;
    return this.rowToObject(results[0].columns, results[0].values[0]);
  }

  queryAll(sql, params = []) {
    const results = this.db.exec(sql, params);
    if (results.length === 0) return [];
    return results[0].values.map(row => this.rowToObject(results[0].columns, row));
  }

  rowToObject(columns, values) {
    const obj = {};
    columns.forEach((col, i) => {
      obj[col] = values[i];
    });
    return obj;
  }

  transaction(fn) {
    this.db.run('BEGIN TRANSACTION');
    try {
      const result = fn();
      this.db.run('COMMIT');
      this.save();
      return result;
    } catch (e) {
      this.db.run('ROLLBACK');
      throw e;
    }
  }

  save() {
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(this.dbPath, buffer);
    } catch (e) {
      console.warn('保存数据库失败:', e.message);
    }
  }

  close() {
    if (this.db) {
      this.save();
      this.db.close();
      this.db = null;
    }
  }
}

module.exports = TerminalDatabase;
