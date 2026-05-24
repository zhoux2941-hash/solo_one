import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/buoy.db');

export function initDatabase(): Database.Database {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS buoy (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      sea_area TEXT,
      anchor_lat REAL NOT NULL,
      anchor_lng REAL NOT NULL,
      deploy_date TEXT,
      status TEXT DEFAULT 'active',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS correction_task (
      id TEXT PRIMARY KEY,
      buoy_id TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      drift_distance REAL,
      drift_direction REAL,
      confidence REAL,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      processed_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buoy_id) REFERENCES buoy(id)
    );

    CREATE TABLE IF NOT EXISTS track_point (
      id TEXT PRIMARY KEY,
      buoy_id TEXT NOT NULL,
      task_id TEXT,
      timestamp TEXT NOT NULL,
      original_lat REAL NOT NULL,
      original_lng REAL NOT NULL,
      corrected_lat REAL,
      corrected_lng REAL,
      source TEXT DEFAULT 'telemetry',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buoy_id) REFERENCES buoy(id),
      FOREIGN KEY (task_id) REFERENCES correction_task(id)
    );

    CREATE TABLE IF NOT EXISTS data_gap (
      id TEXT PRIMARY KEY,
      buoy_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      status TEXT DEFAULT 'open',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buoy_id) REFERENCES buoy(id)
    );

    CREATE TABLE IF NOT EXISTS backfill_data (
      id TEXT PRIMARY KEY,
      gap_id TEXT NOT NULL,
      uploaded_by TEXT NOT NULL,
      point_count INTEGER NOT NULL,
      file_path TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gap_id) REFERENCES data_gap(id)
    );

    CREATE TABLE IF NOT EXISTS verification_record (
      id TEXT PRIMARY KEY,
      gap_id TEXT NOT NULL,
      verified_by TEXT NOT NULL,
      result TEXT NOT NULL,
      comment TEXT,
      verified_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (gap_id) REFERENCES data_gap(id)
    );

    CREATE TABLE IF NOT EXISTS user (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'operator',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_track_point_buoy_time ON track_point(buoy_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_correction_task_status ON correction_task(status);
    CREATE INDEX IF NOT EXISTS idx_data_gap_buoy_status ON data_gap(buoy_id, status);
  `);

  return db;
}

export const db = initDatabase();
export default db;
