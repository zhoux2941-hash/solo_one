import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedStars, seedConnections } from './seedData';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '..', '..', 'data', 'starchart.db');

export const initDatabase = (): Database.Database => {
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS stars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      traditional_name TEXT,
      magnitude REAL NOT NULL,
      ra REAL NOT NULL CHECK (ra >= 0 AND ra < 24),
      dec REAL NOT NULL CHECK (dec >= -90 AND dec <= 90),
      xingguan TEXT,
      constellation_id INTEGER,
      FOREIGN KEY (constellation_id) REFERENCES constellations(id)
    );

    CREATE TABLE IF NOT EXISTS constellations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL CHECK (type IN ('san-yuan', 'er-shi-ba-xiu', 'other')),
      mansion TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      constellation_id INTEGER NOT NULL,
      from_star_id INTEGER NOT NULL,
      to_star_id INTEGER NOT NULL,
      "order" INTEGER NOT NULL,
      FOREIGN KEY (constellation_id) REFERENCES constellations(id),
      FOREIGN KEY (from_star_id) REFERENCES stars(id),
      FOREIGN KEY (to_star_id) REFERENCES stars(id),
      UNIQUE(constellation_id, from_star_id, to_star_id)
    );

    CREATE INDEX IF NOT EXISTS idx_stars_magnitude ON stars(magnitude);
    CREATE INDEX IF NOT EXISTS idx_stars_ra_dec ON stars(ra, dec);
    CREATE INDEX IF NOT EXISTS idx_stars_constellation ON stars(constellation_id);
    CREATE INDEX IF NOT EXISTS idx_connections_constellation ON connections(constellation_id);
  `);

  const constellationCount = db.prepare('SELECT COUNT(*) as count FROM constellations').get() as { count: number };
  
  if (constellationCount.count === 0) {
    const insertConstellation = db.prepare(`
      INSERT INTO constellations (name, type, mansion, description)
      VALUES (?, ?, ?, ?)
    `);

    const constellations = [
      ['紫微垣', 'san-yuan', null, '北天中央，天帝居所'],
      ['太微垣', 'san-yuan', null, '五帝坐，朝廷之象'],
      ['天市垣', 'san-yuan', null, '天子率诸侯幸都市'],
      ['北斗', 'other', null, '北斗七星，帝王车驾'],
      ['角宿', 'er-shi-ba-xiu', '东方苍龙', '苍龙之首'],
      ['亢宿', 'er-shi-ba-xiu', '东方苍龙', '苍龙颈'],
      ['氐宿', 'er-shi-ba-xiu', '东方苍龙', '苍龙之胸'],
      ['房宿', 'er-shi-ba-xiu', '东方苍龙', '苍龙腹'],
      ['心宿', 'er-shi-ba-xiu', '东方苍龙', '苍龙之心'],
      ['尾宿', 'er-shi-ba-xiu', '东方苍龙', '苍龙尾'],
      ['箕宿', 'er-shi-ba-xiu', '东方苍龙', '龙尾摆动'],
      ['斗宿', 'er-shi-ba-xiu', '北方玄武', '玄武之首'],
      ['牛宿', 'er-shi-ba-xiu', '北方玄武', '牛之象'],
      ['女宿', 'er-shi-ba-xiu', '北方玄武', '女之象'],
      ['虚宿', 'er-shi-ba-xiu', '北方玄武', '虚耗之象'],
      ['危宿', 'er-shi-ba-xiu', '北方玄武', '屋栋之象'],
      ['室宿', 'er-shi-ba-xiu', '北方玄武', '营室之象'],
      ['壁宿', 'er-shi-ba-xiu', '北方玄武', '图书之府'],
      ['奎宿', 'er-shi-ba-xiu', '西方白虎', '白虎之首'],
      ['娄宿', 'er-shi-ba-xiu', '西方白虎', '聚众之象'],
      ['胃宿', 'er-shi-ba-xiu', '西方白虎', '仓廪之象'],
      ['昴宿', 'er-shi-ba-xiu', '西方白虎', '白虎之目'],
      ['毕宿', 'er-shi-ba-xiu', '西方白虎', '猎具之象'],
      ['觜宿', 'er-shi-ba-xiu', '西方白虎', '白虎之口'],
      ['参宿', 'er-shi-ba-xiu', '西方白虎', '白虎之身'],
      ['井宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之首'],
      ['鬼宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之目'],
      ['柳宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之喙'],
      ['星宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之颈'],
      ['张宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之嗉'],
      ['翼宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之翼'],
      ['轸宿', 'er-shi-ba-xiu', '南方朱雀', '朱雀之尾'],
    ];

    const tx = db.transaction(() => {
      for (const [name, type, mansion, description] of constellations) {
        insertConstellation.run(name, type, mansion, description);
      }
    });
    tx();
  }

  const starCount = db.prepare('SELECT COUNT(*) as count FROM stars').get() as { count: number };
  
  if (starCount.count === 0) {
    const insertStar = db.prepare(`
      INSERT INTO stars (name, traditional_name, magnitude, ra, dec, xingguan, constellation_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const star of seedStars) {
        insertStar.run(
          star.name,
          star.traditionalName,
          star.magnitude,
          star.ra,
          star.dec,
          star.xingguan,
          star.constellationId
        );
      }
    });
    tx();
  }

  const connectionCount = db.prepare('SELECT COUNT(*) as count FROM connections').get() as { count: number };
  
  if (connectionCount.count === 0) {
    const insertConnection = db.prepare(`
      INSERT INTO connections (constellation_id, from_star_id, to_star_id, "order")
      VALUES (?, ?, ?, ?)
    `);

    const tx = db.transaction(() => {
      for (const conn of seedConnections) {
        insertConnection.run(
          conn.constellationId,
          conn.fromStarId,
          conn.toStarId,
          conn.order
        );
      }
    });
    tx();
  }

  return db;
};

export default initDatabase;
