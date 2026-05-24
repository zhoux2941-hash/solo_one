import { db } from '../db/init.js';
import type { TrackPoint, PointSource } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class TrackRepository {
  static create(point: Omit<TrackPoint, 'id' | 'createdAt'>): TrackPoint {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO track_point (id, buoy_id, task_id, timestamp, original_lat, original_lng, corrected_lat, corrected_lng, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      id, 
      point.buoyId, 
      point.taskId || null, 
      point.timestamp, 
      point.originalLat, 
      point.originalLng, 
      point.correctedLat || null, 
      point.correctedLng || null, 
      point.source, 
      now
    );
    
    return this.getById(id) as TrackPoint;
  }

  static bulkCreate(points: Omit<TrackPoint, 'id' | 'createdAt'>[]): TrackPoint[] {
    const insertStmt = db.prepare(`
      INSERT INTO track_point (id, buoy_id, task_id, timestamp, original_lat, original_lng, corrected_lat, corrected_lng, source, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const createdPoints: TrackPoint[] = [];
    const now = new Date().toISOString();

    const insertMany = db.transaction((points) => {
      for (const point of points) {
        const id = uuidv4();
        insertStmt.run(
          id,
          point.buoyId,
          point.taskId || null,
          point.timestamp,
          point.originalLat,
          point.originalLng,
          point.correctedLat || null,
          point.correctedLng || null,
          point.source,
          now
        );
        createdPoints.push({ ...point, id, createdAt: now } as TrackPoint);
      }
    });

    insertMany(points);
    return createdPoints;
  }

  static getById(id: string): TrackPoint | null {
    const stmt = db.prepare(`
      SELECT 
        id, buoy_id as buoyId, task_id as taskId, timestamp,
        original_lat as originalLat, original_lng as originalLng,
        corrected_lat as correctedLat, corrected_lng as correctedLng,
        source, created_at as createdAt
      FROM track_point WHERE id = ?
    `);
    
    return stmt.get(id) as TrackPoint || null;
  }

  static getByBuoyId(buoyId: string, source?: PointSource): TrackPoint[] {
    let query = `
      SELECT 
        id, buoy_id as buoyId, task_id as taskId, timestamp,
        original_lat as originalLat, original_lng as originalLng,
        corrected_lat as correctedLat, corrected_lng as correctedLng,
        source, created_at as createdAt
      FROM track_point WHERE buoy_id = ?
    `;
    const params: (string | number)[] = [buoyId];
    
    if (source) {
      query += ' AND source = ?';
      params.push(source);
    }
    
    query += ' ORDER BY timestamp ASC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as TrackPoint[];
  }

  static updateCorrection(id: string, correctedLat: number, correctedLng: number): void {
    const stmt = db.prepare(`
      UPDATE track_point SET corrected_lat = ?, corrected_lng = ? WHERE id = ?
    `);
    stmt.run(correctedLat, correctedLng, id);
  }

  static deleteByTaskId(taskId: string): void {
    const stmt = db.prepare('DELETE FROM track_point WHERE task_id = ?');
    stmt.run(taskId);
  }
}
