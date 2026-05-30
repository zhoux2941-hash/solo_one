import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = path.join(__dirname, '..', 'data')
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const DB_PATH = path.join(DATA_DIR, 'drumtower.db')

let db: Database.Database

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
    initializeDatabase(db)
  }
  return db
}

function initializeDatabase(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dynasty TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      description TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS timekeeping_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      shichen TEXT NOT NULL,
      modern_time TEXT NOT NULL,
      bell_count INTEGER NOT NULL DEFAULT 0,
      drum_count INTEGER NOT NULL DEFAULT 0,
      description TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE IF NOT EXISTS interaction_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      city_id INTEGER NOT NULL,
      shichen TEXT NOT NULL,
      bell_count INTEGER NOT NULL DEFAULT 0,
      drum_count INTEGER NOT NULL DEFAULT 0,
      action TEXT NOT NULL,
      timestamp TEXT NOT NULL DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE INDEX IF NOT EXISTS idx_rules_city ON timekeeping_rules(city_id);
    CREATE INDEX IF NOT EXISTS idx_logs_city ON interaction_logs(city_id);
    CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON interaction_logs(timestamp);
  `)

  const cityCount = db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number }
  if (cityCount.count === 0) {
    seedData(db)
  }
}

function seedData(db: Database.Database) {
  const insertCity = db.prepare('INSERT INTO cities (name, dynasty, latitude, longitude, description) VALUES (?, ?, ?, ?, ?)')
  const insertRule = db.prepare(
    'INSERT INTO timekeeping_rules (city_id, shichen, modern_time, bell_count, drum_count, description) VALUES (?, ?, ?, ?, ?, ?)'
  )

  const transaction = db.transaction(() => {
    insertCity.run('西安', '唐/明', 34.2583, 108.9286, '长安鼓楼，晨钟暮鼓108响，古都报时典范')
    insertCity.run('洛阳', '隋/唐', 34.6218, 112.4542, '东都洛阳，钟鼓次数随朝代更迭而异')
    insertCity.run('北京', '明/清', 39.9417, 116.3975, '京城钟鼓楼，晨钟暮鼓各108响，规制最严')

    const xianRules = [
      ['子时', '23:00-01:00', 0, 0, '夜半，万民皆眠'],
      ['丑时', '01:00-03:00', 0, 0, '鸡鸣，荒鸡'],
      ['寅时', '03:00-05:00', 3, 0, '平旦，晨钟初响'],
      ['卯时', '05:00-07:00', 108, 0, '日出，晨钟108响'],
      ['辰时', '07:00-09:00', 0, 0, '食时'],
      ['巳时', '09:00-11:00', 0, 0, '隅中'],
      ['午时', '11:00-13:00', 0, 0, '日中'],
      ['未时', '13:00-15:00', 0, 0, '日昳'],
      ['申时', '15:00-17:00', 0, 0, '晡时'],
      ['酉时', '17:00-19:00', 0, 108, '日入，暮鼓108响'],
      ['戌时', '19:00-21:00', 0, 3, '黄昏，暮鼓初响'],
      ['亥时', '21:00-23:00', 0, 0, '人定'],
    ] as const
    xianRules.forEach(([shichen, time, bell, drum, desc]) => {
      insertRule.run(1, shichen, time, bell, drum, desc)
    })

    const luoyangRules = [
      ['子时', '23:00-01:00', 0, 0, '夜半'],
      ['丑时', '01:00-03:00', 0, 0, '鸡鸣'],
      ['寅时', '03:00-05:00', 5, 0, '平旦，晨钟五响'],
      ['卯时', '05:00-07:00', 54, 0, '日出，晨钟半数'],
      ['辰时', '07:00-09:00', 0, 0, '食时'],
      ['巳时', '09:00-11:00', 0, 0, '隅中'],
      ['午时', '11:00-13:00', 1, 0, '日中，午时钟一响'],
      ['未时', '13:00-15:00', 0, 0, '日昳'],
      ['申时', '15:00-17:00', 0, 0, '晡时'],
      ['酉时', '17:00-19:00', 0, 54, '日入，暮鼓半数'],
      ['戌时', '19:00-21:00', 0, 5, '黄昏，暮鼓五响'],
      ['亥时', '21:00-23:00', 0, 0, '人定'],
    ] as const
    luoyangRules.forEach(([shichen, time, bell, drum, desc]) => {
      insertRule.run(2, shichen, time, bell, drum, desc)
    })

    const beijingRules = [
      ['子时', '23:00-01:00', 0, 0, '夜半，京城更鼓起'],
      ['丑时', '01:00-03:00', 0, 0, '鸡鸣'],
      ['寅时', '03:00-05:00', 0, 0, '平旦'],
      ['卯时', '05:00-07:00', 108, 0, '日出，晨钟108响，紧十八慢十八不紧不慢又十八×2'],
      ['辰时', '07:00-09:00', 0, 0, '食时'],
      ['巳时', '09:00-11:00', 0, 0, '隅中'],
      ['午时', '11:00-13:00', 0, 0, '日中'],
      ['未时', '13:00-15:00', 0, 0, '日昳'],
      ['申时', '15:00-17:00', 0, 0, '晡时'],
      ['酉时', '17:00-19:00', 0, 108, '日入，暮鼓108响，紧十八慢十八不紧不慢又十八×2'],
      ['戌时', '19:00-21:00', 0, 0, '黄昏'],
      ['亥时', '21:00-23:00', 0, 0, '人定，定更鼓止'],
    ] as const
    beijingRules.forEach(([shichen, time, bell, drum, desc]) => {
      insertRule.run(3, shichen, time, bell, drum, desc)
    })
  })

  transaction()
}

export interface City {
  id: number
  name: string
  dynasty: string
  latitude: number | null
  longitude: number | null
  description: string
}

export interface TimekeepingRule {
  id: number
  city_id: number
  shichen: string
  modern_time: string
  bell_count: number
  drum_count: number
  description: string
}

export interface InteractionLog {
  id: number
  city_id: number
  shichen: string
  bell_count: number
  drum_count: number
  action: string
  timestamp: string
}
