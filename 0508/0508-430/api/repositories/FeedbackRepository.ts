import db from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';
import { LowSatisfactionKeyword, ArticleRankingItem, SatisfactionTrendItem } from '../../shared/index.js';

export interface FeedbackRecord {
  id: string;
  query: string;
  article_id: string;
  article_title: string;
  feedback_type: 'useful' | 'useless';
  user_department: string;
  algorithm_group?: string;
  created_at: string;
}

class FeedbackRepository {
  create(
    query: string,
    articleId: string,
    articleTitle: string,
    feedbackType: 'useful' | 'useless',
    userDepartment: string,
    algorithmGroup?: string
  ): string {
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO feedback (id, query, article_id, article_title, feedback_type, user_department, algorithm_group)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, query, articleId, articleTitle, feedbackType, userDepartment, algorithmGroup || null);
    return id;
  }

  getTotalCount(): number {
    const stmt = db.prepare('SELECT COUNT(*) as count FROM feedback');
    const result = stmt.get() as { count: number };
    return result.count;
  }

  getAvgUsefulRate(): number {
    const stmt = db.prepare(`
      SELECT 
        CAST(SUM(CASE WHEN feedback_type = 'useful' THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) as rate
      FROM feedback
    `);
    const result = stmt.get() as { rate: number | null };
    return result.rate || 0;
  }

  getLowSatisfactionKeywords(minSearchCount: number = 5, maxUsefulRate: number = 0.3): LowSatisfactionKeyword[] {
    const stmt = db.prepare(`
      SELECT 
        s.query,
        COUNT(DISTINCT s.id) as searchCount,
        COUNT(f.id) as feedbackCount,
        CAST(SUM(CASE WHEN f.feedback_type = 'useful' THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(f.id), 1) as usefulRate
      FROM search_log s
      LEFT JOIN feedback f ON s.query = f.query
      GROUP BY s.query
      HAVING searchCount >= ? AND usefulRate < ?
      ORDER BY usefulRate ASC
    `);
    return stmt.all(minSearchCount, maxUsefulRate) as LowSatisfactionKeyword[];
  }

  getSatisfactionTrend(granularity: 'day' | 'hour' = 'day', days: number = 7): SatisfactionTrendItem[] {
    const dateFormat = granularity === 'day' 
      ? "DATE(created_at)" 
      : "STRFTIME('%Y-%m-%d %H:00:00', created_at)";
    
    const stmt = db.prepare(`
      SELECT 
        ${dateFormat} as time,
        COUNT(*) as searchCount,
        SUM(CASE WHEN feedback_type = 'useful' THEN 1 ELSE 0 END) as usefulCount,
        SUM(CASE WHEN feedback_type = 'useless' THEN 1 ELSE 0 END) as uselessCount,
        CAST(SUM(CASE WHEN feedback_type = 'useful' THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) as usefulRate
      FROM feedback
      WHERE created_at >= DATE('now', ?)
      GROUP BY ${dateFormat}
      ORDER BY time ASC
    `);
    const result = stmt.all(`-${days} days`) as SatisfactionTrendItem[];
    return result;
  }

  getArticleRanking(limit: number = 10, order: 'asc' | 'desc' = 'desc'): ArticleRankingItem[] {
    const stmt = db.prepare(`
      SELECT 
        article_id as articleId,
        article_title as articleTitle,
        COUNT(*) as feedbackCount,
        SUM(CASE WHEN feedback_type = 'useful' THEN 1 ELSE 0 END) as usefulCount,
        SUM(CASE WHEN feedback_type = 'useless' THEN 1 ELSE 0 END) as uselessCount,
        CAST(SUM(CASE WHEN feedback_type = 'useful' THEN 1 ELSE 0 END) AS REAL) / MAX(COUNT(*), 1) as usefulRate
      FROM feedback
      GROUP BY article_id
      HAVING feedbackCount >= 5
      ORDER BY usefulRate ${order}
      LIMIT ?
    `);
    return stmt.all(limit) as ArticleRankingItem[];
  }

  getFeedbackCountByGroup(algorithmGroup: string, startTime?: string, endTime?: string): { total: number; useful: number } {
    let sql = `
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN feedback_type = 'useful' THEN 1 ELSE 0 END) as useful
      FROM feedback 
      WHERE algorithm_group = ?
    `;
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
    const result = stmt.get(...params) as { total: number; useful: number };
    return result;
  }
}

export default new FeedbackRepository();
