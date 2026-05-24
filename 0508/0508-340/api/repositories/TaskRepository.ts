import { db } from '../db/init.js';
import type { CorrectionTask, TaskStatus } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class TaskRepository {
  static create(buoyId: string): CorrectionTask {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO correction_task (id, buoy_id, status, progress, uploaded_at, created_at)
      VALUES (?, ?, 'pending', 0, ?, ?)
    `);
    
    stmt.run(id, buoyId, now, now);
    
    return this.getById(id) as CorrectionTask;
  }

  static getById(id: string): CorrectionTask | null {
    const stmt = db.prepare(`
      SELECT 
        ct.id, ct.buoy_id as buoyId, b.name as buoyName, b.code as buoyCode,
        ct.status, ct.progress, ct.drift_distance as driftDistance,
        ct.drift_direction as driftDirection, ct.confidence,
        ct.uploaded_at as uploadedAt, ct.processed_at as processedAt, ct.created_at as createdAt
      FROM correction_task ct
      LEFT JOIN buoy b ON ct.buoy_id = b.id
      WHERE ct.id = ?
    `);
    
    return stmt.get(id) as CorrectionTask || null;
  }

  static getAll(status?: TaskStatus, buoyId?: string, seaArea?: string): CorrectionTask[] {
    let query = `
      SELECT 
        ct.id, ct.buoy_id as buoyId, b.name as buoyName, b.code as buoyCode,
        b.sea_area as seaArea,
        ct.status, ct.progress, ct.drift_distance as driftDistance,
        ct.drift_direction as driftDirection, ct.confidence,
        ct.uploaded_at as uploadedAt, ct.processed_at as processedAt, ct.created_at as createdAt
      FROM correction_task ct
      LEFT JOIN buoy b ON ct.buoy_id = b.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];
    
    if (status) {
      query += ' AND ct.status = ?';
      params.push(status);
    }
    
    if (buoyId) {
      query += ' AND ct.buoy_id = ?';
      params.push(buoyId);
    }

    if (seaArea) {
      query += ' AND b.sea_area = ?';
      params.push(seaArea);
    }
    
    query += ' ORDER BY ct.uploaded_at DESC';
    
    const stmt = db.prepare(query);
    return stmt.all(...params) as CorrectionTask[];
  }

  static updateStatus(id: string, status: TaskStatus, progress?: number): void {
    let query = 'UPDATE correction_task SET status = ?';
    const params: (string | number)[] = [status];
    
    if (progress !== undefined) {
      query += ', progress = ?';
      params.push(progress);
    }
    
    if (status === 'processing') {
      query += ', processed_at = CURRENT_TIMESTAMP';
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    const stmt = db.prepare(query);
    stmt.run(...params);
  }

  static updateDriftEstimate(
    id: string, 
    driftDistance: number, 
    driftDirection: number, 
    confidence: number
  ): void {
    const stmt = db.prepare(`
      UPDATE correction_task 
      SET drift_distance = ?, drift_direction = ?, confidence = ?, status = 'completed', progress = 100
      WHERE id = ?
    `);
    stmt.run(driftDistance, driftDirection, confidence, id);
  }

  static getPendingTasks(): CorrectionTask[] {
    return this.getAll('pending');
  }

  static getStats(): { pending: number; processing: number; completed: number; failed: number } {
    const stmt = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed
      FROM correction_task
    `);
    const result = stmt.get() as { pending: number; processing: number; completed: number; failed: number };
    return {
      pending: result.pending || 0,
      processing: result.processing || 0,
      completed: result.completed || 0,
      failed: result.failed || 0
    };
  }
}
