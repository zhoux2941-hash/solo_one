import db from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';

export interface SearchLogRecord {
  id: string;
  query: string;
  user_department: string;
  algorithm_group?: string;
  result_count: number;
  created_at: string;
}

class SearchLogRepository {
  create(query: string, userDepartment: string, algorithmGroup?: string, resultCount: number = 0): string {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO search_log (id, query, user_department, algorithm_group, result_count)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, query, userDepartment, algorithmGroup || null, resultCount);
    return id;
  }

  getSearchCountByQuery(query: string): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM search_log WHERE query = ?
    `);
    const result = stmt.get(query) as { count: number };
    return result.count;
  }

  getTodaySearchCount(): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM search_log 
      WHERE DATE(created_at) = DATE('now')
    `);
    const result = stmt.get() as { count: number };
    return result.count;
  }

  getSearchCountByGroup(algorithmGroup: string, startTime?: string, endTime?: string): number {
    let sql = 'SELECT COUNT(*) as count FROM search_log WHERE algorithm_group = ?';
    const params: string[] = [algorithmGroup];
    
    if (startTime) {
      sql += ' AND created_at >= ?';
      params.push(startTime);
    }
    if (endTime) {
      sql += ' AND created_at <= ?';
      params.push(endTime);
    }
    
    const stmt = db.prepare(sql);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  }
}

export default new SearchLogRepository();
