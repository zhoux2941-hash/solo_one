import type Database from 'better-sqlite3';
import type { Constellation } from '../../shared/types';

export class ConstellationService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getAllConstellations(type?: string): Constellation[] {
    let sql = `
      SELECT 
        c.id,
        c.name,
        c.type,
        c.mansion,
        c.description,
        COALESCE(
          (SELECT JSON_GROUP_ARRAY(s.id) 
           FROM stars s 
           WHERE s.constellation_id = c.id),
          '[]'
        ) as starIds
      FROM constellations c
    `;
    const params: string[] = [];

    if (type) {
      sql += ' WHERE c.type = ?';
      params.push(type);
    }

    sql += ' ORDER BY c.id ASC';

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as (Omit<Constellation, 'starIds'> & { starIds: string })[];

    return rows.map(row => ({
      ...row,
      starIds: JSON.parse(row.starIds) as number[],
    }));
  }

  getConstellationById(id: number): Constellation | null {
    const stmt = this.db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.mansion,
        c.description,
        COALESCE(
          (SELECT JSON_GROUP_ARRAY(s.id) 
           FROM stars s 
           WHERE s.constellation_id = c.id),
          '[]'
        ) as starIds
      FROM constellations c
      WHERE c.id = ?
    `);

    const row = stmt.get(id) as (Omit<Constellation, 'starIds'> & { starIds: string }) | null;

    if (!row) return null;

    return {
      ...row,
      starIds: JSON.parse(row.starIds) as number[],
    };
  }

  getConstellationByName(name: string): Constellation | null {
    const stmt = this.db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.mansion,
        c.description,
        COALESCE(
          (SELECT JSON_GROUP_ARRAY(s.id) 
           FROM stars s 
           WHERE s.constellation_id = c.id),
          '[]'
        ) as starIds
      FROM constellations c
      WHERE c.name = ?
    `);

    const row = stmt.get(name) as (Omit<Constellation, 'starIds'> & { starIds: string }) | null;

    if (!row) return null;

    return {
      ...row,
      starIds: JSON.parse(row.starIds) as number[],
    };
  }

  getConstellationsByMansion(mansion: string): Constellation[] {
    const stmt = this.db.prepare(`
      SELECT 
        c.id,
        c.name,
        c.type,
        c.mansion,
        c.description,
        COALESCE(
          (SELECT JSON_GROUP_ARRAY(s.id) 
           FROM stars s 
           WHERE s.constellation_id = c.id),
          '[]'
        ) as starIds
      FROM constellations c
      WHERE c.mansion = ?
      ORDER BY c.id ASC
    `);

    const rows = stmt.all(mansion) as (Omit<Constellation, 'starIds'> & { starIds: string })[];

    return rows.map(row => ({
      ...row,
      starIds: JSON.parse(row.starIds) as number[],
    }));
  }
}
