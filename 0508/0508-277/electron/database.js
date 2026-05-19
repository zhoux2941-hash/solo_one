import Database from 'better-sqlite3'
import path from 'path'
import { app } from 'electron'
import fs from 'fs'

class RSSDatabase {
  constructor() {
    const userData = app ? app.getPath('userData') : './data'
    if (!fs.existsSync(userData)) {
      fs.mkdirSync(userData, { recursive: true })
    }
    const dbPath = path.join(userData, 'rss-reader.db')
    this.db = new Database(dbPath)
  }

  init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS feeds (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        category TEXT DEFAULT '未分类',
        description TEXT,
        last_fetched_at TIMESTAMP,
        refresh_interval INTEGER DEFAULT 30,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feed_id INTEGER NOT NULL,
        guid TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        link TEXT NOT NULL,
        content TEXT,
        summary TEXT,
        ai_summary TEXT,
        published_at TIMESTAMP,
        is_read INTEGER DEFAULT 0,
        is_starred INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (feed_id) REFERENCES feeds(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );

      CREATE TABLE IF NOT EXISTS reading_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        article_id INTEGER NOT NULL,
        read_duration INTEGER DEFAULT 0,
        read_count INTEGER DEFAULT 1,
        last_read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE,
        UNIQUE(article_id)
      );

      CREATE TABLE IF NOT EXISTS article_features (
        article_id INTEGER PRIMARY KEY,
        keywords TEXT,
        tfidf_vector TEXT,
        category TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS article_similarity (
        article_id_1 INTEGER NOT NULL,
        article_id_2 INTEGER NOT NULL,
        similarity_score REAL NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (article_id_1, article_id_2),
        FOREIGN KEY (article_id_1) REFERENCES articles(id) ON DELETE CASCADE,
        FOREIGN KEY (article_id_2) REFERENCES articles(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feature_vector TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_articles_feed_id ON articles(feed_id);
      CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at);
      CREATE INDEX IF NOT EXISTS idx_articles_is_read ON articles(is_read);
      CREATE INDEX IF NOT EXISTS idx_articles_is_starred ON articles(is_starred);
      CREATE INDEX IF NOT EXISTS idx_reading_history_article_id ON reading_history(article_id);
      CREATE INDEX IF NOT EXISTS idx_article_similarity_score ON article_similarity(similarity_score DESC);
    `)

    const defaultSettings = this.db.prepare('SELECT COUNT(*) as count FROM settings').get()
    if (defaultSettings.count === 0) {
      this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('refreshInterval', '30')
      this.db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('autoGenerateSummary', '1')
    }
  }

  getFeeds() {
    return this.db.prepare('SELECT * FROM feeds ORDER BY created_at DESC').all()
  }

  getFeed(id) {
    return this.db.prepare('SELECT * FROM feeds WHERE id = ?').get(id)
  }

  addFeed(url, title, category, description) {
    const result = this.db.prepare(
      'INSERT INTO feeds (url, title, category, description) VALUES (?, ?, ?, ?)'
    ).run(url, title, category, description)
    return result.lastInsertRowid
  }

  deleteFeed(id) {
    return this.db.prepare('DELETE FROM feeds WHERE id = ?').run(id)
  }

  updateFeedLastFetched(id) {
    return this.db.prepare('UPDATE feeds SET last_fetched_at = CURRENT_TIMESTAMP WHERE id = ?').run(id)
  }

  articleExists(guid) {
    const result = this.db.prepare('SELECT id FROM articles WHERE guid = ?').get(guid)
    return !!result
  }

  addArticle(feedId, guid, title, link, content, summary, publishedAt) {
    if (this.articleExists(guid)) {
      return null
    }
    const result = this.db.prepare(
      'INSERT INTO articles (feed_id, guid, title, link, content, summary, published_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(feedId, guid, title, link, content, summary, publishedAt)
    return result.lastInsertRowid
  }

  getArticles(feedId = null, filter = 'all', category = null) {
    let query = 'SELECT a.*, f.title as feed_title, f.category FROM articles a JOIN feeds f ON a.feed_id = f.id'
    const params = []
    const conditions = []

    if (feedId) {
      conditions.push('a.feed_id = ?')
      params.push(feedId)
    }

    if (category) {
      conditions.push('f.category = ?')
      params.push(category)
    }

    if (filter === 'unread') {
      conditions.push('a.is_read = 0')
    } else if (filter === 'starred') {
      conditions.push('a.is_starred = 1')
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }

    query += ' ORDER BY a.published_at DESC'

    return this.db.prepare(query).all(...params)
  }

  getArticle(id) {
    return this.db.prepare('SELECT * FROM articles WHERE id = ?').get(id)
  }

  markAsRead(articleId, read = true) {
    return this.db.prepare('UPDATE articles SET is_read = ? WHERE id = ?').run(read ? 1 : 0, articleId)
  }

  markAsStarred(articleId, starred = true) {
    return this.db.prepare('UPDATE articles SET is_starred = ? WHERE id = ?').run(starred ? 1 : 0, articleId)
  }

  updateArticleContent(id, content) {
    return this.db.prepare('UPDATE articles SET content = ? WHERE id = ?').run(content, id)
  }

  updateAISummary(id, summary) {
    return this.db.prepare('UPDATE articles SET ai_summary = ? WHERE id = ?').run(summary, id)
  }

  getSettings() {
    const rows = this.db.prepare('SELECT key, value FROM settings').all()
    const settings = {}
    rows.forEach(row => {
      settings[row.key] = row.value
    })
    return settings
  }

  updateSettings(settings) {
    const stmt = this.db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
    for (const [key, value] of Object.entries(settings)) {
      stmt.run(key, String(value))
    }
    return true
  }

  getCategories() {
    const rows = this.db.prepare('SELECT DISTINCT category FROM feeds WHERE category IS NOT NULL AND category != ""').all()
    return rows.map(row => row.category)
  }

  recordReading(articleId, duration = 0) {
    const existing = this.db.prepare('SELECT * FROM reading_history WHERE article_id = ?').get(articleId)
    if (existing) {
      return this.db.prepare(`
        UPDATE reading_history 
        SET read_duration = read_duration + ?, 
            read_count = read_count + 1,
            last_read_at = CURRENT_TIMESTAMP
        WHERE article_id = ?
      `).run(duration, articleId)
    } else {
      return this.db.prepare(`
        INSERT INTO reading_history (article_id, read_duration)
        VALUES (?, ?)
      `).run(articleId, duration)
    }
  }

  getReadingHistory() {
    return this.db.prepare(`
      SELECT rh.*, a.title, a.feed_id, a.is_starred
      FROM reading_history rh
      JOIN articles a ON rh.article_id = a.id
      ORDER BY rh.last_read_at DESC
    `).all()
  }

  saveArticleFeatures(articleId, keywords, tfidfVector, category = null) {
    const existing = this.db.prepare('SELECT article_id FROM article_features WHERE article_id = ?').get(articleId)
    if (existing) {
      return this.db.prepare(`
        UPDATE article_features 
        SET keywords = ?, tfidf_vector = ?, category = ?, updated_at = CURRENT_TIMESTAMP
        WHERE article_id = ?
      `).run(JSON.stringify(keywords), JSON.stringify(tfidfVector), category, articleId)
    } else {
      return this.db.prepare(`
        INSERT INTO article_features (article_id, keywords, tfidf_vector, category)
        VALUES (?, ?, ?, ?)
      `).run(articleId, JSON.stringify(keywords), JSON.stringify(tfidfVector), category)
    }
  }

  getArticleFeatures(articleId) {
    const row = this.db.prepare('SELECT * FROM article_features WHERE article_id = ?').get(articleId)
    if (row) {
      return {
        ...row,
        keywords: JSON.parse(row.keywords || '[]'),
        tfidfVector: JSON.parse(row.tfidf_vector || '{}')
      }
    }
    return null
  }

  getAllArticleFeatures() {
    const rows = this.db.prepare('SELECT * FROM article_features').all()
    return rows.map(row => ({
      ...row,
      keywords: JSON.parse(row.keywords || '[]'),
      tfidfVector: JSON.parse(row.tfidf_vector || '{}')
    }))
  }

  saveArticleSimilarity(articleId1, articleId2, score) {
    return this.db.prepare(`
      INSERT OR REPLACE INTO article_similarity (article_id_1, article_id_2, similarity_score)
      VALUES (?, ?, ?)
    `).run(articleId1, articleId2, score)
  }

  getSimilarArticles(articleId, limit = 10) {
    return this.db.prepare(`
      SELECT a.*, asim.similarity_score, f.title as feed_title
      FROM article_similarity asim
      JOIN articles a ON asim.article_id_2 = a.id
      JOIN feeds f ON a.feed_id = f.id
      WHERE asim.article_id_1 = ? AND a.id != ?
      ORDER BY asim.similarity_score DESC
      LIMIT ?
    `).all(articleId, articleId, limit)
  }

  clearArticleSimilarity() {
    return this.db.prepare('DELETE FROM article_similarity').run()
  }

  getUserPreferences() {
    const row = this.db.prepare('SELECT * FROM user_preferences ORDER BY last_updated DESC LIMIT 1').get()
    if (row) {
      return {
        ...row,
        featureVector: JSON.parse(row.feature_vector || '{}')
      }
    }
    return null
  }

  saveUserPreferences(featureVector) {
    return this.db.prepare(`
      INSERT INTO user_preferences (feature_vector, last_updated)
      VALUES (?, CURRENT_TIMESTAMP)
    `).run(JSON.stringify(featureVector))
  }

  getArticlesForRecommendation() {
    return this.db.prepare(`
      SELECT a.*, f.title as feed_title, f.category
      FROM articles a
      JOIN feeds f ON a.feed_id = f.id
      WHERE a.is_read = 0
      ORDER BY a.published_at DESC
      LIMIT 100
    `).all()
  }

  close() {
    this.db.close()
  }
}

export default RSSDatabase
