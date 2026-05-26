import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'notes.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT 'yellow',
    archived INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL DEFAULT 0,
    sortOrder INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

const cols = db.prepare("PRAGMA table_info(notes)").all() as { name: string }[];
if (!cols.some((c) => c.name === 'sortOrder')) {
  db.exec('ALTER TABLE notes ADD COLUMN sortOrder INTEGER NOT NULL DEFAULT 0');
  db.exec('UPDATE notes SET sortOrder = position WHERE sortOrder = 0');
}

export interface Note {
  id: number;
  title: string;
  content: string;
  color: string;
  archived: number;
  position: number;
  sortOrder: number;
  created_at: string;
  updated_at: string;
}

export const PRESET_COLORS = ['yellow', 'pink', 'blue', 'green', 'orange', 'purple'] as const;
export type PresetColor = (typeof PRESET_COLORS)[number];
