import { db } from '../db/init.js';
import type { DataGap, GapStatus, BackfillData } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class GapRepository {
  static create(gap: Omit<DataGap, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'backfillData' | 'verification'>): DataGap {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO data_gap (id, buoy_id, start_time, end_time, duration_seconds, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
    `);
    
    stmt.run(id, gap.buoyId, gap.startTime, gap.endTime, gap.durationSeconds, now, now);
    
    return this.getById(id) as DataGap;
  }

  static bulkCreate(gaps: Omit<DataGap, 'id' | 'status' | 'createdAt' | 'updatedAt' | 'backfillData' | 'verification'>[]): DataGap[] {
    const createdGaps: DataGap[] = [];
    const now = new Date().toISOString();

    const insertMany = db.transaction((gaps) => {
      const stmt = db.prepare(`
        INSERT INTO data_gap (id, buoy_id, start_time, end_time, duration_seconds, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'open', ?, ?)
      `);
      
      for (const gap of gaps) {
        const id = uuidv4();
        stmt.run(id, gap.buoyId, gap.startTime, gap.endTime, gap.durationSeconds, now, now);
        createdGaps.push({ 
          ...gap, 
          id, 
          status: 'open', 
          createdAt: now, 
          updatedAt: now 
        } as DataGap);
      }
    });

    insertMany(gaps);
    return createdGaps;
  }

  static getById(id: string): DataGap | null {
    const stmt = db.prepare(`
      SELECT 
        dg.id, dg.buoy_id as buoyId, dg.start_time as startTime, dg.end_time as endTime,
        dg.duration_seconds as durationSeconds, dg.status, dg.created_at as createdAt, dg.updated_at as updatedAt
      FROM data_gap dg
      WHERE dg.id = ?
    `);
    
    const gap = stmt.get(id) as DataGap;
    if (!gap) return null;

    gap.backfillData = this.getBackfillData(id);
    gap.verification = this.getVerification(id);
    
    return gap;
  }

  static getByBuoyId(buoyId: string, status?: GapStatus): DataGap[] {
    let query = `
      SELECT 
        dg.id, dg.buoy_id as buoyId, dg.start_time as startTime, dg.end_time as endTime,
        dg.duration_seconds as durationSeconds, dg.status, dg.created_at as createdAt, dg.updated_at as updatedAt
      FROM data_gap dg
      WHERE dg.buoy_id = ?
    `;
    const params: (string | number)[] = [buoyId];
    
    if (status) {
      query += ' AND dg.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY dg.start_time DESC';
    
    const stmt = db.prepare(query);
    const gaps = stmt.all(...params) as DataGap[];
    
    for (const gap of gaps) {
      gap.backfillData = this.getBackfillData(gap.id);
      gap.verification = this.getVerification(gap.id);
    }
    
    return gaps;
  }

  static updateStatus(id: string, status: GapStatus): void {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE data_gap SET status = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, now, id);
  }

  static addBackfillData(gapId: string, uploadedBy: string, pointCount: number, filePath?: string): BackfillData {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO backfill_data (id, gap_id, uploaded_by, point_count, file_path, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, gapId, uploadedBy, pointCount, filePath || null, now);
    this.updateStatus(gapId, 'backfilled');
    
    return {
      id,
      gapId,
      uploadedBy,
      pointCount,
      filePath,
      uploadedAt: now
    };
  }

  static getBackfillData(gapId: string): BackfillData | undefined {
    const stmt = db.prepare(`
      SELECT 
        id, gap_id as gapId, uploaded_by as uploadedBy, 
        point_count as pointCount, file_path as filePath, uploaded_at as uploadedAt
      FROM backfill_data WHERE gap_id = ?
      ORDER BY uploaded_at DESC LIMIT 1
    `);
    return stmt.get(gapId) as BackfillData;
  }

  static getVerification(gapId: string): import('../../shared/types.js').VerificationRecord | undefined {
    const stmt = db.prepare(`
      SELECT 
        id, gap_id as gapId, verified_by as verifiedBy,
        result, comment, verified_at as verifiedAt
      FROM verification_record WHERE gap_id = ?
      ORDER BY verified_at DESC LIMIT 1
    `);
    const record = stmt.get(gapId) as any;
    return record ? {
      ...record,
      result: record.result as import('../../shared/types.js').VerificationResult
    } : undefined;
  }

  static detectGaps(buoyId: string, maxGapSeconds: number = 3600): DataGap[] {
    const allPoints = db.prepare(`
      SELECT timestamp, source FROM track_point 
      WHERE buoy_id = ?
      ORDER BY timestamp ASC
    `).all(buoyId) as { timestamp: string; source: string }[];

    if (allPoints.length < 2) return [];

    const existingGaps = this.getByBuoyId(buoyId);
    const existingGapRanges = existingGaps.map(g => ({
      start: new Date(g.startTime).getTime(),
      end: new Date(g.endTime).getTime()
    }));

    const isOverlapping = (start: number, end: number): boolean => {
      return existingGapRanges.some(range => 
        !(end < range.start || start > range.end)
      );
    };

    const gaps: DataGap[] = [];
    
    for (let i = 1; i < allPoints.length; i++) {
      const prevTime = new Date(allPoints[i - 1].timestamp).getTime();
      const currTime = new Date(allPoints[i].timestamp).getTime();
      const diffSeconds = (currTime - prevTime) / 1000;
      
      if (diffSeconds > maxGapSeconds && !isOverlapping(prevTime, currTime)) {
        gaps.push({
          id: '',
          buoyId,
          startTime: allPoints[i - 1].timestamp,
          endTime: allPoints[i].timestamp,
          durationSeconds: Math.round(diffSeconds),
          status: 'open',
          createdAt: '',
          updatedAt: ''
        });
      }
    }

    if (gaps.length > 0) {
      console.log(`[GapRepository] 检测到 ${gaps.length} 个新数据缺口`);
      return this.bulkCreate(gaps);
    }
    return [];
  }
}


