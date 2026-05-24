import { db } from '../db/init.js';
import type { VerificationRecord, VerificationResult } from '../../shared/types.js';
import { v4 as uuidv4 } from 'uuid';

export class VerificationRepository {
  static create(
    gapId: string,
    verifiedBy: string,
    result: VerificationResult,
    comment?: string
  ): VerificationRecord {
    const id = uuidv4();
    const now = new Date().toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO verification_record (id, gap_id, verified_by, result, comment, verified_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, gapId, verifiedBy, result, comment || null, now);

    const updateGapStmt = db.prepare(`
      UPDATE data_gap SET status = ?, updated_at = ? WHERE id = ?
    `);
    updateGapStmt.run(result === 'confirmed' ? 'verified' : 'rejected', now, gapId);
    
    return {
      id,
      gapId,
      verifiedBy,
      result,
      comment,
      verifiedAt: now
    };
  }

  static getById(id: string): VerificationRecord | null {
    const stmt = db.prepare(`
      SELECT 
        id, gap_id as gapId, verified_by as verifiedBy,
        result, comment, verified_at as verifiedAt
      FROM verification_record WHERE id = ?
    `);
    
    return stmt.get(id) as VerificationRecord || null;
  }

  static getByGapId(gapId: string): VerificationRecord[] {
    const stmt = db.prepare(`
      SELECT 
        id, gap_id as gapId, verified_by as verifiedBy,
        result, comment, verified_at as verifiedAt
      FROM verification_record WHERE gap_id = ?
      ORDER BY verified_at DESC
    `);
    
    return stmt.all(gapId) as VerificationRecord[];
  }

  static getByBuoyId(buoyId: string): VerificationRecord[] {
    const stmt = db.prepare(`
      SELECT 
        vr.id, vr.gap_id as gapId, vr.verified_by as verifiedBy,
        vr.result, vr.comment, vr.verified_at as verifiedAt
      FROM verification_record vr
      INNER JOIN data_gap dg ON vr.gap_id = dg.id
      WHERE dg.buoy_id = ?
      ORDER BY vr.verified_at DESC
    `);
    
    return stmt.all(buoyId) as VerificationRecord[];
  }

  static getHistory(gapId: string): VerificationRecord[] {
    return this.getByGapId(gapId);
  }
}
