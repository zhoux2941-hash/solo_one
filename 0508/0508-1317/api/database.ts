import initSqlJs, { type Database } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '..', 'data', 'oracle.db')
const WASM_PATH = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')

let db: Database | null = null

function saveDb(): void {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(DB_PATH, buffer)
}

function loadDbFromFile(): Uint8Array | null {
  if (!fs.existsSync(DB_PATH)) return null
  const buffer = fs.readFileSync(DB_PATH)
  return new Uint8Array(buffer)
}

function createTables(): void {
  if (!db) throw new Error('Database not initialized')

  db.run(`
    CREATE TABLE IF NOT EXISTS divination_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      interpretation TEXT NOT NULL,
      period TEXT NOT NULL DEFAULT '商'
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS oracle_examples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      period TEXT NOT NULL,
      description TEXT NOT NULL,
      shell_type TEXT NOT NULL CHECK(shell_type IN ('plastron', 'carapace')),
      pit_shape TEXT NOT NULL CHECK(pit_shape IN ('circle', 'jujube')),
      temperature INTEGER NOT NULL,
      anisotropy_ratio REAL NOT NULL DEFAULT 1.5,
      crack_data TEXT NOT NULL,
      inscriptions TEXT NOT NULL
    )
  `)
}

function seedData(): void {
  if (!db) throw new Error('Database not initialized')

  const count = db.exec('SELECT COUNT(*) as cnt FROM divination_templates')
  if (count[0]?.values[0]?.[0] as number > 0) return

  db.run(`INSERT INTO divination_templates (category, content, interpretation, period) VALUES
    ('天气', '癸巳卜，今日雨？', '癸巳日占卜，今天会下雨吗？', '商'),
    ('天气', '甲午卜，来日大风雨？', '甲午日占卜，明天会有大风雨吗？', '商'),
    ('军事', '壬辰卜，征土方，受又？', '壬辰日占卜，征伐土方，会得到保佑吗？', '商'),
    ('军事', '丙申卜，伐羌，今夕受又？', '丙申日占卜，征伐羌方，今夜会得到保佑吗？', '商'),
    ('祭祀', '乙卯卜，侑于祖丁？', '乙卯日占卜，对祖丁进行侑祭吗？', '商'),
    ('祭祀', '丁巳卜，酒于大甲？', '丁巳日占卜，对大甲进行酒祭吗？', '商'),
    ('农业', '庚子卜，受年？', '庚子日占卜，今年收成好吗？', '商'),
    ('农业', '辛丑卜，黍年有足雨？', '辛丑日占卜，种黍的年份有充足的雨水吗？', '商'),
    ('田猎', '戊午卜，逐鹿，获？', '戊午日占卜，逐鹿能捕获吗？', '商'),
    ('疾病', '己未卜，王疾齿，祟？', '己未日占卜，王牙痛，是鬼神作祟吗？', '商'),
    ('生育', '甲寅卜，妇好娩，嘉？', '甲寅日占卜，妇好分娩，会吉利吗？', '商'),
    ('出行', '癸酉卜，行，亡灾？', '癸酉日占卜，出行，没有灾祸吧？', '商')
  `)

  db.run(`INSERT INTO oracle_examples (name, period, description, shell_type, pit_shape, temperature, anisotropy_ratio, crack_data, inscriptions) VALUES
    ('宾组腹甲·雨卜', '商·武丁', '宾组卜辞，腹甲完整，卜问降雨之事。刻辞分布于兆纹两侧，为武丁时期典型腹甲占卜实物。', 'plastron', 'jujube', 850, 1.8, '[]', '[]'),
    ('宾组背甲·征伐', '商·武丁', '宾组卜辞，背甲残片，卜问征伐土方之事。兆纹清晰，卜辞竖列排列，为武丁时期军事占卜代表。', 'carapace', 'circle', 950, 0.8, '[]', '[]'),
    ('宾组腹甲·祭祀', '商·武丁', '宾组卜辞，腹甲大版，卜问祭祀先祖之事。多组兆纹并存，卜辞密集，为武丁时期祭祀占卜珍贵标本。', 'plastron', 'jujube', 1050, 2.2, '[]', '[]')
  `)

  saveDb()
}

export async function initialize(): Promise<void> {
  if (db) return

  const SQL = await initSqlJs({
    locateFile: () => WASM_PATH,
  })

  const fileData = loadDbFromFile()
  db = fileData ? new SQL.Database(fileData) : new SQL.Database()

  createTables()
  seedData()

  if (!fileData) {
    saveDb()
  }
}

export function getDb(): Database {
  if (!db) throw new Error('Database not initialized. Call initialize() first.')
  return db
}

export { saveDb }
