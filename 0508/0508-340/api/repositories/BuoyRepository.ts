import { db } from '../db/init.js';
import type { Buoy, BuoyStatus } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class BuoyRepository {
  static create(buoy: Omit<Buoy, 'id' | 'createdAt' | 'updatedAt'>): Buoy {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO buoy (id, name, code, sea_area, anchor_lat, anchor_lng, deploy_date, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, buoy.name, buoy.code, buoy.seaArea, buoy.anchorLat, buoy.anchorLng, buoy.deployDate, buoy.status, now, now);
    
    return this.getById(id) as Buoy;
  }

  static getById(id: string): Buoy | null {
    const stmt = db.prepare(`
      SELECT 
        id, name, code, sea_area as seaArea, anchor_lat as anchorLat, anchor_lng as anchorLng,
        deploy_date as deployDate, status, created_at as createdAt, updated_at as updatedAt
      FROM buoy WHERE id = ?
    `);
    
    return stmt.get(id) as Buoy || null;
  }

  static getByCode(code: string): Buoy | null {
    const stmt = db.prepare(`
      SELECT 
        id, name, code, sea_area as seaArea, anchor_lat as anchorLat, anchor_lng as anchorLng,
        deploy_date as deployDate, status, created_at as createdAt, updated_at as updatedAt
      FROM buoy WHERE code = ?
    `);
    
    return stmt.get(code) as Buoy || null;
  }

  static getAll(seaArea?: string): Buoy[] {
    let query = `
      SELECT 
        id, name, code, sea_area as seaArea, anchor_lat as anchorLat, anchor_lng as anchorLng,
        deploy_date as deployDate, status, created_at as createdAt, updated_at as updatedAt
      FROM buoy
    `;
    const params: string[] = [];
    
    if (seaArea) {
      query += ' WHERE sea_area = ?';
      params.push(seaArea);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as Buoy[];
  }

  static updateStatus(id: string, status: BuoyStatus): void {
    const stmt = db.prepare(`
      UPDATE buoy SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    `);
    stmt.run(status, id);
  }

  static getSeaAreas(): { id: string; name: string; code: string; buoyCount: number }[] {
    const stmt = db.prepare(`
      SELECT 
        sea_area as id, 
        sea_area as name, 
        sea_area as code, 
        COUNT(*) as buoyCount
      FROM buoy 
      WHERE sea_area IS NOT NULL AND sea_area != ''
      GROUP BY sea_area
      ORDER BY sea_area
    `);
    return stmt.all() as { id: string; name: string; code: string; buoyCount: number }[];
  }
}
