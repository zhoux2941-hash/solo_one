import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'annotations.db');

let dbInstance: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    const buffer = fs.readFileSync(DB_FILE);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  return dbInstance;
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS scores (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      composer TEXT NOT NULL,
      instrument TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      svg_content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS annotation_versions (
      id TEXT PRIMARY KEY,
      score_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      version_number INTEGER NOT NULL DEFAULT 1,
      color TEXT NOT NULL DEFAULT '#333333',
      is_final INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (score_id) REFERENCES scores(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS annotations (
      id TEXT PRIMARY KEY,
      version_id TEXT NOT NULL,
      score_id TEXT NOT NULL,
      type TEXT NOT NULL,
      measure_number INTEGER NOT NULL,
      beat_position REAL NOT NULL DEFAULT 0,
      content TEXT NOT NULL,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 40,
      height REAL NOT NULL DEFAULT 30,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (version_id) REFERENCES annotation_versions(id),
      FOREIGN KEY (score_id) REFERENCES scores(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conflicts (
      id TEXT PRIMARY KEY,
      score_id TEXT NOT NULL,
      measure_number INTEGER NOT NULL,
      type TEXT NOT NULL,
      resolved INTEGER NOT NULL DEFAULT 0,
      resolved_version_id TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (score_id) REFERENCES scores(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conflict_annotations (
      conflict_id TEXT NOT NULL,
      annotation_id TEXT NOT NULL,
      PRIMARY KEY (conflict_id, annotation_id),
      FOREIGN KEY (conflict_id) REFERENCES conflicts(id),
      FOREIGN KEY (annotation_id) REFERENCES annotations(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS export_tasks (
      id TEXT PRIMARY KEY,
      score_id TEXT NOT NULL,
      format TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      file_path TEXT,
      config TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (score_id) REFERENCES scores(id)
    )
  `);
}

export function saveDatabase(db: Database) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_FILE, buffer);
}

export function queryAll<T = any>(db: Database, sql: string, params: any[] = []): T[] {
  const results = db.exec(sql, params);
  if (results.length === 0) return [];
  const cols = results[0].columns;
  return results[0].values.map((row: any[]) => {
    const obj: any = {};
    cols.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

export function queryOne<T = any>(db: Database, sql: string, params: any[] = []): T | null {
  const results = queryAll<T>(db, sql, params);
  return results.length > 0 ? results[0] : null;
}

export function runSql(db: Database, sql: string, params: any[] = []) {
  db.run(sql, params);
  saveDatabase(db);
}

export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
