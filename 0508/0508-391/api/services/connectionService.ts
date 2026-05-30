import type Database from 'better-sqlite3';
import type { Connection } from '../../shared/types';

export class ConnectionService {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  getAllConnections(constellationId?: number): Connection[] {
    let sql = `
      SELECT 
        id,
        constellation_id as constellationId,
        from_star_id as fromStarId,
        to_star_id as toStarId,
        "order"
      FROM connections
    `;
    const params: number[] = [];

    if (constellationId !== undefined) {
      sql += ' WHERE constellation_id = ?';
      params.push(constellationId);
    }

    sql += ' ORDER BY constellation_id, "order" ASC';

    const stmt = this.db.prepare(sql);
    return stmt.all(...params) as Connection[];
  }

  getConnectionsByConstellation(constellationId: number): Connection[] {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        constellation_id as constellationId,
        from_star_id as fromStarId,
        to_star_id as toStarId,
        "order"
      FROM connections
      WHERE constellation_id = ?
      ORDER BY "order" ASC
    `);
    return stmt.all(constellationId) as Connection[];
  }

  getConnectionById(id: number): Connection | null {
    const stmt = this.db.prepare(`
      SELECT 
        id,
        constellation_id as constellationId,
        from_star_id as fromStarId,
        to_star_id as toStarId,
        "order"
      FROM connections
      WHERE id = ?
    `);
    return stmt.get(id) as Connection | null;
  }
}
