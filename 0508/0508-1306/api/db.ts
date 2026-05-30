import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '..', 'data', 'database.db');

let db: any = null;

export async function initDatabase() {
  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const SQL = await initSqlJs({
    locateFile: (file: string) =>
      path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
  });

  let dbBuffer: any;
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      title TEXT,
      black_player TEXT,
      white_player TEXT,
      date TEXT,
      result TEXT,
      created_at INTEGER
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT,
      move_number INTEGER,
      position_x INTEGER,
      position_y INTEGER,
      color TEXT,
      timestamp INTEGER,
      FOREIGN KEY (game_id) REFERENCES games(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS openings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      move_sequence TEXT,
      win_rate REAL,
      description TEXT
    )
  `);

  try {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM openings');
    const result = stmt.getAsObject();
    if (result.count === 0) {
      seedOpenings(db);
    }
  } catch (e) {
    seedOpenings(db);
  }

  saveDatabase(db);

  return db;
}

function seedOpenings(db: any) {
  console.log('Seeding opening database...');

  const openings = generateOpenings();
  
  const stmt = db.prepare(
    'INSERT INTO openings (name, move_sequence, win_rate, description) VALUES (?, ?, ?, ?)'
  );

  openings.forEach((opening) => {
    stmt.run([
      opening.name,
      JSON.stringify(opening.moveSequence),
      opening.winRate,
      opening.description,
    ]);
  });

  console.log(`Seeded ${openings.length} openings`);
}

function generateOpenings() {
  const openings = [];
  const centerMoves = [
    { x: 8, y: 8 },
    { x: 7, y: 8 },
    { x: 9, y: 8 },
    { x: 8, y: 7 },
    { x: 8, y: 9 },
    { x: 7, y: 7 },
    { x: 9, y: 9 },
    { x: 7, y: 9 },
    { x: 9, y: 7 },
    { x: 6, y: 8 },
    { x: 10, y: 8 },
    { x: 8, y: 6 },
    { x: 8, y: 10 },
  ];

  const openingNames = [
    '天元开局',
    '小目开局',
    '星位开局',
    '三三开局',
    '对角星',
    '连星',
    '双飞燕',
    '高目',
    '低目',
    '外势',
    '实地',
    '平衡',
  ];

  for (let i = 0; i < 200; i++) {
    const moveCount = 3 + Math.floor(Math.random() * 5);
    const moveSequence = [];
    const usedPositions = new Set();

    for (let j = 0; j < moveCount && j < centerMoves.length; j++) {
      const idx = (i + j) % centerMoves.length;
      const move = centerMoves[idx];
      const key = `${move.x},${move.y}`;
      if (!usedPositions.has(key)) {
        moveSequence.push(move);
        usedPositions.add(key);
      }
    }

    if (moveSequence.length > 0) {
      openings.push({
        name: `${openingNames[i % openingNames.length]} ${Math.floor(i / openingNames.length) + 1}`,
        moveSequence,
        winRate: 45 + Math.random() * 10,
        description: `藏棋经典开局变化第${i + 1}号`,
      });
    }
  }

  return openings;
}

export function saveDatabase(db: any) {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

export async function getDatabase() {
  if (!db) {
    db = await initDatabase();
  }
  return db;
}

export default { initDatabase, getDatabase, saveDatabase };
