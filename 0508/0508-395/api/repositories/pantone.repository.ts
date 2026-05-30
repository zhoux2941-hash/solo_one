import { getDb } from '../db/connection';
import type { PantoneColor, RGB, Lab } from '../../shared/types';
import { colorAlgorithms } from '../../shared/color-algorithms';

function rowToColor(row: any): PantoneColor {
  return {
    id: row.id,
    pantoneCode: row.pantone_code,
    name: row.name,
    nameZh: row.name_zh,
    rgb: { r: row.r, g: row.g, b: row.b },
    cmyk: { c: row.c, m: row.m, y: row.y, k: row.k },
    lab: { L: row.lab_l, a: row.lab_a, b: row.lab_b },
    hex: row.hex,
    category: row.category,
    description: row.description
  };
}

export function findByCode(code: string): PantoneColor | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM pantone_colors WHERE pantone_code = ?').get(code);
  return row ? rowToColor(row) : null;
}

export function search(query: string, limit: number = 50): PantoneColor[] {
  const db = getDb();
  const searchQuery = `%${query}%`;
  const rows = db.prepare(`
    SELECT * FROM pantone_colors 
    WHERE pantone_code LIKE ? OR name LIKE ? OR name_zh LIKE ?
    ORDER BY pantone_code
    LIMIT ?
  `).all(searchQuery, searchQuery, searchQuery, limit);
  
  return rows.map(rowToColor);
}

export function list(page: number = 1, pageSize: number = 50, category?: string): { colors: PantoneColor[]; total: number } {
  const db = getDb();
  const offset = (page - 1) * pageSize;
  
  let whereClause = '';
  let params: any[] = [];
  
  if (category) {
    whereClause = 'WHERE category = ?';
    params.push(category);
  }
  
  const countStmt = db.prepare(`SELECT COUNT(*) as count FROM pantone_colors ${whereClause}`);
  const total = (countStmt.get(...params) as { count: number }).count;
  
  const rows = db.prepare(`
    SELECT * FROM pantone_colors ${whereClause}
    ORDER BY pantone_code
    LIMIT ? OFFSET ?
  `).all(...params, pageSize, offset);
  
  return {
    colors: rows.map(rowToColor),
    total
  };
}

export function findByRgb(rgb: RGB, limit: number = 5): PantoneColor[] {
  const db = getDb();
  const targetLab = colorAlgorithms.rgbToLab(rgb);
  
  const rows = db.prepare(`
    SELECT * FROM pantone_colors
    ORDER BY 
      POW(lab_l - ?, 2) + POW(lab_a - ?, 2) + POW(lab_b - ?, 2)
    ASC LIMIT ?
  `).all(targetLab.L, targetLab.a, targetLab.b, limit);
  
  return rows.map(rowToColor);
}

export function findClosestByRgb(rgb: RGB): PantoneColor | null {
  const colors = findByRgb(rgb, 1);
  return colors.length > 0 ? colors[0] : null;
}

export function getCategories(): string[] {
  const db = getDb();
  const rows = db.prepare(`
    SELECT DISTINCT category FROM pantone_colors 
    WHERE category IS NOT NULL 
    ORDER BY category
  `).all() as { category: string }[];
  
  return rows.map(r => r.category);
}

export function findByIds(ids: number[]): PantoneColor[] {
  if (ids.length === 0) return [];
  
  const db = getDb();
  const placeholders = ids.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT * FROM pantone_colors 
    WHERE id IN (${placeholders})
    ORDER BY pantone_code
  `).all(...ids);
  
  return rows.map(rowToColor);
}

export function getPresetColors(): PantoneColor[] {
  const db = getDb();
  const presetCodes = [
    'PANTONE 185 C',
    'PANTONE 293 C', 
    'PANTONE 109 C',
    'PANTONE 354 C',
    'PANTONE 2685 C',
    'PANTONE 871 C',
    'PANTONE 877 C',
    'PANTONE 1655 C',
    'PANTONE 2395 C'
  ];
  
  const placeholders = presetCodes.map(() => '?').join(',');
  const rows = db.prepare(`
    SELECT * FROM pantone_colors 
    WHERE pantone_code IN (${placeholders})
    ORDER BY pantone_code
  `).all(...presetCodes);
  
  return rows.map(rowToColor);
}
