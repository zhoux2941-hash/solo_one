import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'data', 'booking.db');
const dataDir = path.dirname(dbPath);

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('busy_timeout = 5000');
db.pragma('foreign_keys = ON');

const initSql = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf-8');
db.exec(initSql);

function initSeedData() {
  const packageCount = db.prepare('SELECT COUNT(*) as count FROM packages').get() as { count: number };
  
  if (packageCount.count === 0) {
    const insertPackage = db.prepare(`
      INSERT INTO packages (name, classes, price, original_price, validity_days, description, is_recommended)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    insertPackage.run('体验套餐', 10, 1500, 2000, 180, '适合初次体验的用户，10节课有效期半年', 0);
    insertPackage.run('进阶套餐', 20, 2800, 4000, 180, '热门推荐，性价比最高，20节课有效期半年', 1);
    insertPackage.run('尊享套餐', 50, 6000, 10000, 365, '长期训练首选，50节课有效期一年', 0);
  }

  const coachCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role = ?').get('coach') as { count: number };
  
  if (coachCount.count === 0) {
    const passwordHash = bcrypt.hashSync('123456', 10);
    
    const insertUser = db.prepare(`
      INSERT INTO users (phone, name, role, avatar, password_hash)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const insertCoach = db.prepare(`
      INSERT INTO coaches (user_id, specialty, bio, rating)
      VALUES (?, ?, ?, ?)
    `);

    const coaches = [
      { phone: '13800000001', name: '张教练', specialty: '健身教练', bio: '国家一级健身教练，10年经验，擅长力量训练和体能提升', rating: 4.9, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach1' },
      { phone: '13800000002', name: '李教练', specialty: '瑜伽教练', bio: '高级瑜伽导师，擅长阴瑜伽和流瑜伽，帮助您找到内心平静', rating: 4.8, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach2' },
      { phone: '13800000003', name: '王教练', specialty: '私教教练', bio: '专业私人教练，减脂增肌专家，定制化训练方案', rating: 4.95, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach3' },
      { phone: '13800000004', name: '刘教练', specialty: '舞蹈教练', bio: '现代舞、爵士舞教练，让您在运动中感受艺术的魅力', rating: 4.7, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach4' },
      { phone: '13800000005', name: '陈教练', specialty: '游泳教练', bio: '前国家队游泳运动员，专业游泳培训，从入门到精通', rating: 5.0, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=coach5' },
    ];

    coaches.forEach((coach, index) => {
      const result = insertUser.run(coach.phone, coach.name, 'coach', coach.avatar, passwordHash);
      insertCoach.run(result.lastInsertRowid, coach.specialty, coach.bio, coach.rating);
    });

    const memberResult = insertUser.run('13900000001', '测试会员', 'member', 'https://api.dicebear.com/7.x/avataaars/svg?seed=member1', passwordHash);
    db.prepare('INSERT INTO members (user_id, remaining_classes) VALUES (?, ?)').run(memberResult.lastInsertRowid, 0);
  }
}

function runMigrations() {
  try {
    const cols = db.pragma("table_info(settlements)") as { name: string }[];
    const colNames = cols.map(c => c.name);
    
    if (!colNames.includes('start_date')) {
      db.exec(`
        CREATE TABLE settlements_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          coach_id INTEGER NOT NULL REFERENCES coaches(id),
          month VARCHAR(7) NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          total_classes INTEGER NOT NULL DEFAULT 0,
          total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
          status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(coach_id, month)
        );
        INSERT INTO settlements_new (id, coach_id, month, start_date, end_date, total_classes, total_amount, status, created_at)
        SELECT id, coach_id, month, month || '-01', month || '-28', total_classes, total_amount, status, created_at
        FROM settlements;
        DROP TABLE settlements;
        ALTER TABLE settlements_new RENAME TO settlements;
      `);
      console.log('数据库迁移完成：settlements表添加start_date和end_date列');
    }
  } catch (error) {
    console.warn('数据库迁移跳过:', error);
  }
}

runMigrations();
initSeedData();

export default db;
