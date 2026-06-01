import db from '../db/init.js';
import { v4 as uuidv4 } from 'uuid';

class ArticleClickStatsRepository {
  incrementClick(articleId: string, articleTitle: string, query: string): void {
    const today = new Date().toISOString().split('T')[0];
    const id = uuidv4();
    
    const stmt = db.prepare(`
      INSERT INTO article_click_stats (id, article_id, article_title, query, click_count, stat_date)
      VALUES (?, ?, ?, ?, 1, ?)
      ON CONFLICT(article_id, query, stat_date) 
      DO UPDATE SET click_count = click_count + 1
    `);
    stmt.run(id, articleId, articleTitle, query, today);
  }

  getClickStats(query: string): Map<string, number> {
    const stmt = db.prepare(`
      SELECT article_id, SUM(click_count) as total_clicks
      FROM article_click_stats
      WHERE query = ?
      GROUP BY article_id
    `);
    const results = stmt.all(query) as { article_id: string; total_clicks: number }[];
    
    const clickMap = new Map<string, number>();
    for (const r of results) {
      clickMap.set(`${r.article_id}:${query}`, r.total_clicks);
    }
    return clickMap;
  }

  getClickCount(articleId: string, query: string): number {
    const stmt = db.prepare(`
      SELECT SUM(click_count) as total
      FROM article_click_stats
      WHERE article_id = ? AND query = ?
    `);
    const result = stmt.get(articleId, query) as { total: number | null };
    return result.total || 0;
  }
}

export default new ArticleClickStatsRepository();
