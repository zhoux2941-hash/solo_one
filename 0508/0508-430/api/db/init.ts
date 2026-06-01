import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'knowledge_base.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

const initSql = `
CREATE TABLE IF NOT EXISTS search_log (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    user_department TEXT NOT NULL,
    algorithm_group TEXT,
    result_count INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_log_query ON search_log(query);
CREATE INDEX IF NOT EXISTS idx_search_log_department ON search_log(user_department);
CREATE INDEX IF NOT EXISTS idx_search_log_created_at ON search_log(created_at);

CREATE TABLE IF NOT EXISTS feedback (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    article_id TEXT NOT NULL,
    article_title TEXT NOT NULL,
    feedback_type TEXT NOT NULL CHECK(feedback_type IN ('useful', 'useless')),
    user_department TEXT NOT NULL,
    algorithm_group TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_feedback_query ON feedback(query);
CREATE INDEX IF NOT EXISTS idx_feedback_article ON feedback(article_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at);

CREATE TABLE IF NOT EXISTS pin_config (
    id TEXT PRIMARY KEY,
    keyword TEXT UNIQUE NOT NULL,
    article_id TEXT NOT NULL,
    article_title TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_pin_config_keyword ON pin_config(keyword);
CREATE INDEX IF NOT EXISTS idx_pin_config_active ON pin_config(is_active);

CREATE TABLE IF NOT EXISTS ab_test (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    algorithm_a TEXT NOT NULL DEFAULT 'default',
    algorithm_b TEXT NOT NULL DEFAULT 'click_weighted',
    start_time DATETIME,
    end_time DATETIME,
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'running', 'completed')),
    created_by TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ab_test_status ON ab_test(status);
CREATE INDEX IF NOT EXISTS idx_ab_test_created_at ON ab_test(created_at);

CREATE TABLE IF NOT EXISTS ab_test_assignment (
    id TEXT PRIMARY KEY,
    ab_test_id TEXT NOT NULL,
    department TEXT NOT NULL,
    group_assignment TEXT NOT NULL CHECK(group_assignment IN ('A', 'B')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ab_test_id) REFERENCES ab_test(id) ON DELETE CASCADE,
    UNIQUE(ab_test_id, department)
);

CREATE TABLE IF NOT EXISTS operation_log (
    id TEXT PRIMARY KEY,
    operator TEXT NOT NULL,
    operation_type TEXT NOT NULL,
    target_keyword TEXT,
    target_article_id TEXT,
    target_article_title TEXT,
    details TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_operation_log_operator ON operation_log(operator);
CREATE INDEX IF NOT EXISTS idx_operation_log_type ON operation_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_operation_log_created_at ON operation_log(created_at);

CREATE TABLE IF NOT EXISTS article_click_stats (
    id TEXT PRIMARY KEY,
    article_id TEXT NOT NULL,
    article_title TEXT NOT NULL,
    query TEXT NOT NULL,
    click_count INTEGER DEFAULT 0,
    stat_date DATE NOT NULL,
    UNIQUE(article_id, query, stat_date)
);

CREATE INDEX IF NOT EXISTS idx_click_stats_article ON article_click_stats(article_id);
CREATE INDEX IF NOT EXISTS idx_click_stats_date ON article_click_stats(stat_date);

CREATE TABLE IF NOT EXISTS admin_user (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;

db.exec(initSql);

const adminCheck = db.prepare('SELECT COUNT(*) as count FROM admin_user').get() as { count: number };
if (adminCheck.count === 0) {
  const passwordHash = bcrypt.hashSync('admin123', 10);
  const insertAdmin = db.prepare(
    'INSERT INTO admin_user (id, username, password_hash) VALUES (?, ?, ?)'
  );
  insertAdmin.run('admin_001', 'admin', passwordHash);
  console.log('管理员账号已初始化: admin / admin123');
}

export default db;
