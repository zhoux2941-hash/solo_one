import db from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';
import { PinConfig } from '../../shared/index.js';

class PinConfigRepository {
  create(keyword: string, articleId: string, articleTitle: string, createdBy: string): string {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO pin_config (id, keyword, article_id, article_title, created_by, is_active)
      VALUES (?, ?, ?, ?, ?, 1)
    `);
    stmt.run(id, keyword, articleId, articleTitle, createdBy);
    return id;
  }

  getActivePin(keyword: string): PinConfig | null {
    const stmt = db.prepare(`
      SELECT 
        id,
        keyword,
        article_id as articleId,
        article_title as articleTitle,
        created_by as createdBy,
        created_at as createdAt,
        is_active as isActive
      FROM pin_config 
      WHERE keyword = ? AND is_active = 1
    `);
    const result = stmt.get(keyword) as PinConfig | null;
    return result || null;
  }

  getAll(): PinConfig[] {
    const stmt = db.prepare(`
      SELECT 
        id,
        keyword,
        article_id as articleId,
        article_title as articleTitle,
        created_by as createdBy,
        created_at as createdAt,
        is_active as isActive
      FROM pin_config 
      ORDER BY created_at DESC
    `);
    return stmt.all() as PinConfig[];
  }

  deactivate(id: string): boolean {
    const stmt = db.prepare(`
      UPDATE pin_config SET is_active = 0 WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

export default new PinConfigRepository();
