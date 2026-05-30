import type Database from 'better-sqlite3';
import type { Star } from '../../shared/types';

export class StarService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getAllStars(magnitudeLte?: number): Star[] {
    let sql = `
      SELECT 
        id,
        name,
        traditional_name as traditionalName,
        magnitude,
        ra,
        dec,
        xingguan,
        constellation_id as constellationId
      FROM stars
    `;
    const params: (number | string)[] = [];

    if (magnitudeLte !== undefined) {
      sql += ' WHERE magnitude <= ?';
      params.push(magnitudeLte);
    }

    sql += ' ORDER BY magnitude ASC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Star[];
  }

  getStarById(id: number): Star | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        traditional_name as traditionalName,
        magnitude,
        ra,
        dec,
        xingguan,
        constellation_id as constellationId
      FROM stars
      WHERE id = ?
    `);
    return stmt.get(id) as Star | null;
  }

  getStarsByConstellation(constellationId: number): Star[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        traditional_name as traditionalName,
        magnitude,
        ra,
        dec,
        xingguan,
        constellation_id as constellationId
      FROM stars
      WHERE constellation_id = ?
      ORDER BY magnitude ASC
    `);
    return stmt.all(constellationId) as Star[];
  }

  getStarsByXingguan(xingguan: string): Star[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        name,
        traditional_name as traditionalName,
        magnitude,
        ra,
        dec,
        xingguan,
        constellation_id as constellationId
      FROM stars
      WHERE xingguan = ?
      ORDER BY magnitude ASC
    `);
    return stmt.all(xingguan) as Star[];
  }
}
