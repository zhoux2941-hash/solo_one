import type { SqlJsStatic, Database as SqliteDatabase } from 'sql.js';
import type { MaterialGrade, Preset, Dynasty, ModuleData } from './types';
import wasmUrl from '/sql-wasm.wasm?url';

let db: SqliteDatabase | null = null;
let initSqlJsPromise: Promise<SqlJsStatic> | null = null;

async function getInitSqlJs(): Promise<SqlJsStatic> {
  if (!initSqlJsPromise) {
    initSqlJsPromise = (async () => {
      const mod = await import('sql.js');
      const initFn: (config?: any) => Promise<SqlJsStatic> =
        (mod as any).default || (mod as any).Module || mod;
      return initFn({
        locateFile: () => wasmUrl,
      });
    })();
  }
  return initSqlJsPromise;
}

const SONG_GRADES: Omit<MaterialGrade, 'id'>[] = [
  { dynasty: '宋', grade: 1, dancai_height: 15, dancai_width: 10, zucai_height: 21, qi_height: 6, fen_mm: 33.33 },
  { dynasty: '宋', grade: 2, dancai_height: 14.25, dancai_width: 9.5, zucai_height: 20, qi_height: 5.75, fen_mm: 30.0 },
  { dynasty: '宋', grade: 3, dancai_height: 13.5, dancai_width: 9, zucai_height: 19, qi_height: 5.5, fen_mm: 26.67 },
  { dynasty: '宋', grade: 4, dancai_height: 12.75, dancai_width: 8.5, zucai_height: 18, qi_height: 5.25, fen_mm: 23.33 },
  { dynasty: '宋', grade: 5, dancai_height: 12, dancai_width: 8, zucai_height: 17, qi_height: 5, fen_mm: 20.0 },
  { dynasty: '宋', grade: 6, dancai_height: 11.25, dancai_width: 7.5, zucai_height: 16, qi_height: 4.75, fen_mm: 16.67 },
  { dynasty: '宋', grade: 7, dancai_height: 10.5, dancai_width: 7, zucai_height: 15, qi_height: 4.5, fen_mm: 13.33 },
  { dynasty: '宋', grade: 8, dancai_height: 9.75, dancai_width: 6.5, zucai_height: 14, qi_height: 4.25, fen_mm: 10.0 },
];

const QING_GRADES: Omit<MaterialGrade, 'id'>[] = [
  { dynasty: '清', grade: 1, dancai_height: 6, dancai_width: 4, zucai_height: 8.4, qi_height: 2.4, fen_mm: 25.6 },
  { dynasty: '清', grade: 2, dancai_height: 5.5, dancai_width: 3.7, zucai_height: 7.7, qi_height: 2.2, fen_mm: 23.04 },
  { dynasty: '清', grade: 3, dancai_height: 5, dancai_width: 3.4, zucai_height: 7, qi_height: 2, fen_mm: 20.48 },
  { dynasty: '清', grade: 4, dancai_height: 4.5, dancai_width: 3, zucai_height: 6.3, qi_height: 1.8, fen_mm: 17.92 },
  { dynasty: '清', grade: 5, dancai_height: 4, dancai_width: 2.6, zucai_height: 5.6, qi_height: 1.6, fen_mm: 15.36 },
  { dynasty: '清', grade: 6, dancai_height: 3.5, dancai_width: 2.3, zucai_height: 4.9, qi_height: 1.4, fen_mm: 12.8 },
  { dynasty: '清', grade: 7, dancai_height: 3, dancai_width: 2, zucai_height: 4.2, qi_height: 1.2, fen_mm: 10.24 },
  { dynasty: '清', grade: 8, dancai_height: 2.5, dancai_width: 1.7, zucai_height: 3.5, qi_height: 1, fen_mm: 7.68 },
];

const PRESETS: Omit<Preset, 'id'>[] = [
  { name: '佛光寺东大殿', dynasty: '宋', grade: 2, jumps: 4, description: '唐代木构，面阔七间，四跳华拱，单材15×10份' },
  { name: '祈年殿', dynasty: '清', grade: 4, jumps: 3, description: '清代皇家坛庙建筑，三跳斗拱，麻叶头' },
  { name: '太和殿', dynasty: '清', grade: 2, jumps: 5, description: '清代宫殿最高等级，五跳斗拱' },
  { name: '隆兴寺摩尼殿', dynasty: '宋', grade: 3, jumps: 3, description: '北宋木构，三跳华拱，补间铺作' },
  { name: '应县木塔', dynasty: '宋', grade: 2, jumps: 5, description: '辽代楼阁式木塔，五跳华拱' },
];

export async function initDatabase(): Promise<SqliteDatabase> {
  if (db) return db;

  const SQLInstance = await getInitSqlJs();

  db = new SQLInstance.Database();

  db.run(`
    CREATE TABLE material_grade (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dynasty TEXT NOT NULL,
      grade INTEGER NOT NULL,
      dancai_height REAL NOT NULL,
      dancai_width REAL NOT NULL,
      zucai_height REAL NOT NULL,
      qi_height REAL NOT NULL,
      fen_mm REAL NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE preset (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dynasty TEXT NOT NULL,
      grade INTEGER NOT NULL,
      jumps INTEGER NOT NULL,
      description TEXT
    )
  `);

  for (const g of [...SONG_GRADES, ...QING_GRADES]) {
    db.run(
      'INSERT INTO material_grade (dynasty, grade, dancai_height, dancai_width, zucai_height, qi_height, fen_mm) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [g.dynasty, g.grade, g.dancai_height, g.dancai_width, g.zucai_height, g.qi_height, g.fen_mm]
    );
  }

  for (const p of PRESETS) {
    db.run(
      'INSERT INTO preset (name, dynasty, grade, jumps, description) VALUES (?, ?, ?, ?, ?)',
      [p.name, p.dynasty, p.grade, p.jumps, p.description]
    );
  }

  return db;
}

export function getMaterialGrade(dynasty: Dynasty, grade: number): ModuleData | null {
  if (!db) return null;
  const result = db.exec(
    'SELECT dancai_height, dancai_width, zucai_height, qi_height, fen_mm FROM material_grade WHERE dynasty = ? AND grade = ?',
    [dynasty, grade]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;
  const row = result[0].values[0];
  return {
    dancaiHeight: row[0] as number,
    dancaiWidth: row[1] as number,
    zucaiHeight: row[2] as number,
    qiHeight: row[3] as number,
    fenMm: row[4] as number,
  };
}

export function getAllPresets(): Preset[] {
  if (!db) return [];
  const result = db.exec('SELECT id, name, dynasty, grade, jumps, description FROM preset');
  if (result.length === 0) return [];
  return result[0].values.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    dynasty: row[2] as Dynasty,
    grade: row[3] as number,
    jumps: row[4] as number,
    description: row[5] as string,
  }));
}
