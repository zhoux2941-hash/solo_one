const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, '../data/flasher.db');
let db;

async function init() {
  const dataDir = path.dirname(dbPath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(err);
      } else {
        createTables()
          .then(() => migrateDatabase())
          .then(() => createDefaultUser())
          .then(resolve)
          .catch(reject);
      }
    });
  });
}

function migrateDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.all("PRAGMA table_info(firmware)", (err, columns) => {
        if (err) {
          reject(err);
          return;
        }
        
        const columnNames = columns.map(c => c.name);
        const migrations = [];
        
        if (!columnNames.includes('file_type')) {
          migrations.push("ALTER TABLE firmware ADD COLUMN file_type TEXT");
        }
        if (!columnNames.includes('start_address')) {
          migrations.push("ALTER TABLE firmware ADD COLUMN start_address INTEGER DEFAULT 0");
        }
        if (!columnNames.includes('is_encrypted')) {
          migrations.push("ALTER TABLE firmware ADD COLUMN is_encrypted BOOLEAN DEFAULT 0");
        }
        if (!columnNames.includes('encryption_type')) {
          migrations.push("ALTER TABLE firmware ADD COLUMN encryption_type TEXT");
        }
        if (!columnNames.includes('parse_method')) {
          migrations.push("ALTER TABLE firmware ADD COLUMN parse_method TEXT");
        }
        if (!columnNames.includes('warnings')) {
          migrations.push("ALTER TABLE firmware ADD COLUMN warnings TEXT");
        }
        
        db.all("PRAGMA table_info(devices)", (err, devColumns) => {
          if (err) {
            reject(err);
            return;
          }
          
          const devColNames = devColumns.map(c => c.name);
          
          if (!devColNames.includes('pnp_id')) {
            migrations.push("ALTER TABLE devices ADD COLUMN pnp_id TEXT");
          }
          if (!devColNames.includes('vendor_id')) {
            migrations.push("ALTER TABLE devices ADD COLUMN vendor_id TEXT");
          }
          if (!devColNames.includes('product_id')) {
            migrations.push("ALTER TABLE devices ADD COLUMN product_id TEXT");
          }
          if (!devColNames.includes('device_type')) {
            migrations.push("ALTER TABLE devices ADD COLUMN device_type TEXT");
          }
          if (!devColNames.includes('manufacturer')) {
            migrations.push("ALTER TABLE devices ADD COLUMN manufacturer TEXT");
          }
          
          if (migrations.length === 0) {
            resolve();
            return;
          }
          
          let completed = 0;
          migrations.forEach(sql => {
            db.run(sql, (err) => {
              if (err) {
                console.warn('Migration warning:', err.message);
              }
              completed++;
              if (completed === migrations.length) {
                resolve();
              }
            });
          });
        });
      });
    });
  });
}

function createTables() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'operator',
        real_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS firmware (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        version TEXT NOT NULL,
        hardware_model TEXT,
        description TEXT,
        md5_hash TEXT,
        file_type TEXT,
        start_address INTEGER DEFAULT 0,
        is_encrypted BOOLEAN DEFAULT 0,
        encryption_type TEXT,
        parse_method TEXT,
        warnings TEXT,
        uploader_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (uploader_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS devices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        serial_number TEXT,
        hardware_model TEXT,
        port_name TEXT,
        baud_rate INTEGER DEFAULT 115200,
        status TEXT DEFAULT 'offline',
        current_firmware_id INTEGER,
        pnp_id TEXT,
        vendor_id TEXT,
        product_id TEXT,
        device_type TEXT,
        manufacturer TEXT,
        last_connect_time DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (current_firmware_id) REFERENCES firmware(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS flash_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT UNIQUE NOT NULL,
        firmware_id INTEGER NOT NULL,
        device_count INTEGER DEFAULT 0,
        success_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        status TEXT DEFAULT 'pending',
        operator_id INTEGER,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (firmware_id) REFERENCES firmware(id),
        FOREIGN KEY (operator_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS flash_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id TEXT,
        device_id INTEGER,
        port_name TEXT,
        firmware_id INTEGER,
        status TEXT NOT NULL,
        progress INTEGER DEFAULT 0,
        error_message TEXT,
        started_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES flash_tasks(task_id),
        FOREIGN KEY (device_id) REFERENCES devices(id),
        FOREIGN KEY (firmware_id) REFERENCES firmware(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS operation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        action TEXT NOT NULL,
        module TEXT NOT NULL,
        details TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS debug_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        port_name TEXT NOT NULL,
        direction TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
}

function createDefaultUser() {
  return new Promise((resolve, reject) => {
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count === 0) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync('admin123', salt);
        
        db.run(`INSERT INTO users (username, password, role, real_name) 
                VALUES (?, ?, ?, ?)`, 
          ['admin', hash, 'admin', '系统管理员'], 
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      } else {
        resolve();
      }
    });
  });
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function close() {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

module.exports = { init, close, run, get, all };
