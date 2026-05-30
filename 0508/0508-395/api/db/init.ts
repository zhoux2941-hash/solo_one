import { getDb } from './connection';

const createTablesSql = `
CREATE TABLE IF NOT EXISTS pantone_colors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pantone_code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    name_zh TEXT,
    r INTEGER NOT NULL CHECK (r BETWEEN 0 AND 255),
    g INTEGER NOT NULL CHECK (g BETWEEN 0 AND 255),
    b INTEGER NOT NULL CHECK (b BETWEEN 0 AND 255),
    c REAL NOT NULL CHECK (c BETWEEN 0 AND 100),
    m REAL NOT NULL CHECK (m BETWEEN 0 AND 100),
    y REAL NOT NULL CHECK (y BETWEEN 0 AND 100),
    k REAL NOT NULL CHECK (k BETWEEN 0 AND 100),
    lab_l REAL NOT NULL,
    lab_a REAL NOT NULL,
    lab_b REAL NOT NULL,
    hex TEXT NOT NULL,
    category TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pantone_code ON pantone_colors(pantone_code);
CREATE INDEX IF NOT EXISTS idx_pantone_name ON pantone_colors(name);
CREATE INDEX IF NOT EXISTS idx_pantone_rgb ON pantone_colors(r, g, b);
CREATE INDEX IF NOT EXISTS idx_pantone_category ON pantone_colors(category);
`;

export function initDatabase(): void {
  const db = getDb();
  db.exec(createTablesSql);
  console.log('Database initialized successfully');
}
