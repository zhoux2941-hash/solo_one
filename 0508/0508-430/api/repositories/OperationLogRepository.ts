import db from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';
import { OperationLog } from '../../shared/index.js';

type OperationType = 'pin_set' | 'pin_remove' | 'abtest_create' | 'abtest_start' | 'abtest_stop';

class OperationLogRepository {
  create(
    operator: string,
    operationType: OperationType,
    details: string,
    targetKeyword?: string,
    targetArticleId?: string,
    targetArticleTitle?: string
  ): string {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO operation_log 
      (id, operator, operation_type, target_keyword, target_article_id, target_article_title, details)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      id,
      operator,
      operationType,
      targetKeyword || null,
      targetArticleId || null,
      targetArticleTitle || null,
      details
    );
    return id;
  }

  getAll(limit: number = 100, offset: number = 0): OperationLog[] {
    const stmt = db.prepare(`
      SELECT 
        id,
        operator,
        operation_type as operationType,
        target_keyword as targetKeyword,
        target_article_id as targetArticleId,
        target_article_title as targetArticleTitle,
        details,
        created_at as timestamp
      FROM operation_log 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset) as OperationLog[];
  }

  getByType(operationType: OperationType, limit: number = 50): OperationLog[] {
    const stmt = db.prepare(`
      SELECT 
        id,
        operator,
        operation_type as operationType,
        target_keyword as targetKeyword,
        target_article_id as targetArticleId,
        target_article_title as targetArticleTitle,
        details,
        created_at as timestamp
      FROM operation_log 
      WHERE operation_type = ?
      ORDER BY created_at DESC
      LIMIT ?
    `);
    return stmt.all(operationType, limit) as OperationLog[];
  }
}

export default new OperationLogRepository();
