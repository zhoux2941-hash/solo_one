import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.join(__dirname, '../data/batik.db')

let db: Database.Database | null = null

const svgWrap = (paths: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${paths}</svg>`

const builtinPatterns: Array<{
  name: string
  category: 'natural' | 'geometric' | 'animal' | 'plant'
  svg_path: string
}> = [
  {
    name: '涡纹',
    category: 'natural',
    svg_path: svgWrap(
      '<path d="M50 50 C50 38 62 30 70 38 C80 48 72 64 58 66 C42 68 30 54 34 40 C38 24 56 16 72 22 C90 30 94 54 82 68 C68 84 40 86 28 70 C14 52 18 24 38 14 C60 4 86 16 92 40 C98 66 78 90 50 90 C22 90 2 66 8 40" fill="none" stroke="#1A2332" stroke-width="2"/>'
    ),
  },
  {
    name: '太阳纹',
    category: 'natural',
    svg_path: svgWrap(
      '<circle cx="50" cy="50" r="12" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="6" fill="#1A2332"/>' +
        '<line x1="50" y1="8" x2="50" y2="28" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="50" y1="72" x2="50" y2="92" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="8" y1="50" x2="28" y2="50" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="72" y1="50" x2="92" y2="50" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="20" y1="20" x2="34" y2="34" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="66" y1="66" x2="80" y2="80" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="80" y1="20" x2="66" y2="34" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="34" y1="66" x2="20" y2="80" stroke="#1A2332" stroke-width="2"/>'
    ),
  },
  {
    name: '铜鼓纹',
    category: 'geometric',
    svg_path: svgWrap(
      '<circle cx="50" cy="50" r="40" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="30" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="20" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="4" fill="#1A2332"/>' +
        '<line x1="50" y1="10" x2="50" y2="20" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="50" y1="80" x2="50" y2="90" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="10" y1="50" x2="20" y2="50" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="80" y1="50" x2="90" y2="50" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="22" y1="22" x2="29" y2="29" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="71" y1="71" x2="78" y2="78" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="78" y1="22" x2="71" y2="29" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="29" y1="71" x2="22" y2="78" stroke="#1A2332" stroke-width="2"/>'
    ),
  },
  {
    name: '鱼纹',
    category: 'animal',
    svg_path: svgWrap(
      '<path d="M20 50 C20 50 30 30 50 30 C70 30 80 50 80 50 C80 50 70 70 50 70 C30 70 20 50 20 50Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M80 50 L92 40 L92 60 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="35" cy="46" r="3" fill="#1A2332"/>' +
        '<path d="M45 50 C48 44 55 44 58 50 C55 56 48 56 45 50Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M28 50 L38 48 M28 50 L38 52" stroke="#1A2332" stroke-width="1"/>'
    ),
  },
  {
    name: '鸟纹',
    category: 'animal',
    svg_path: svgWrap(
      '<path d="M20 60 C25 55 35 40 50 35 C60 32 70 35 75 42 C78 46 80 52 75 55" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M75 55 C70 52 65 55 68 60 C72 65 80 58 75 55Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 35 C52 28 58 22 65 20 C60 26 56 30 53 34" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="73" cy="44" r="2" fill="#1A2332"/>' +
        '<path d="M75 42 L82 40" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M30 58 L22 68 M32 56 L26 66" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '蝴蝶纹',
    category: 'animal',
    svg_path: svgWrap(
      '<path d="M50 30 C40 20 15 22 18 40 C20 52 38 55 50 50" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 30 C60 20 85 22 82 40 C80 52 62 55 50 50" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 55 C40 58 22 65 25 78 C28 88 42 85 50 75" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 55 C60 58 78 65 75 78 C72 88 58 85 50 75" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="50" y1="30" x2="50" y2="75" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 30 L46 18 M50 30 L54 18" stroke="#1A2332" stroke-width="1.5"/>' +
        '<circle cx="34" cy="38" r="3" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<circle cx="66" cy="38" r="3" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '花纹',
    category: 'plant',
    svg_path: svgWrap(
      '<circle cx="50" cy="50" r="8" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="3" fill="#1A2332"/>' +
        '<path d="M50 20 C56 28 56 38 50 42 C44 38 44 28 50 20Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 58 C56 62 56 72 50 80 C44 72 44 62 50 58Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M20 50 C28 44 38 44 42 50 C38 56 28 56 20 50Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M58 50 C62 44 72 44 80 50 C72 56 62 56 58 50Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M29 29 C36 32 40 38 37 44 C31 42 28 36 29 29Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M71 29 C72 36 69 42 63 44 C60 38 64 32 71 29Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M29 71 C28 64 31 58 37 56 C40 62 36 68 29 71Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M71 71 C64 68 60 62 63 56 C69 58 72 64 71 71Z" fill="none" stroke="#1A2332" stroke-width="2"/>'
    ),
  },
  {
    name: '树纹',
    category: 'plant',
    svg_path: svgWrap(
      '<rect x="47" y="60" width="6" height="30" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 60 C50 60 30 55 25 42 C22 34 28 26 35 24" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 60 C50 60 70 55 75 42 C78 34 72 26 65 24" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M35 24 C32 18 36 12 42 14 C44 8 50 8 50 14 C50 8 56 8 58 14 C64 12 68 18 65 24" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M40 45 C36 40 38 34 43 35" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M60 45 C64 40 62 34 57 35" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M44 80 L38 90 M56 80 L62 90" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '山纹',
    category: 'natural',
    svg_path: svgWrap(
      '<path d="M5 85 L25 35 L35 55 L50 15 L65 55 L75 35 L95 85 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M15 85 L30 50 L40 65 L50 40 L60 65 L70 50 L85 85" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M45 25 L50 15 L55 25" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M22 42 L25 35 L28 42" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M72 42 L75 35 L78 42" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '水纹',
    category: 'natural',
    svg_path: svgWrap(
      '<path d="M5 30 C15 22 25 22 35 30 C45 38 55 38 65 30 C75 22 85 22 95 30" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M5 45 C15 37 25 37 35 45 C45 53 55 53 65 45 C75 37 85 37 95 45" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M5 60 C15 52 25 52 35 60 C45 68 55 68 65 60 C75 52 85 52 95 60" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M5 75 C15 67 25 67 35 75 C45 83 55 83 65 75 C75 67 85 67 95 75" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M15 24 L20 18 M55 24 L60 18 M80 24 L85 18" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '云纹',
    category: 'natural',
    svg_path: svgWrap(
      '<path d="M15 60 C15 48 25 40 35 42 C38 32 48 28 55 34 C60 26 72 28 74 38 C82 36 90 44 86 54 C92 58 90 68 80 68 L22 68 C14 68 10 60 15 60Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M30 68 C30 68 32 76 38 76 C44 76 44 68 44 68" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M55 68 C55 68 57 78 63 78 C69 78 69 68 69 68" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M25 52 C30 48 40 50 40 56" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M60 40 C65 36 75 40 72 48" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '雷纹',
    category: 'geometric',
    svg_path: svgWrap(
      '<path d="M10 10 L30 10 L30 25 L25 25 L25 30 L10 30 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M40 10 L60 10 L60 25 L55 25 L55 30 L40 30 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M70 10 L90 10 L90 30 L75 30 L75 25 L70 25 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M10 40 L25 40 L25 45 L30 45 L30 60 L10 60 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M40 45 L55 45 L55 40 L60 40 L60 60 L40 60 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M70 40 L90 40 L90 60 L75 60 L75 55 L70 55 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M10 70 L30 70 L30 85 L25 85 L25 90 L10 90 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M40 70 L60 70 L60 90 L55 90 L55 85 L40 85 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M70 70 L75 70 L75 85 L90 85 L90 90 L70 90 Z" fill="none" stroke="#1A2332" stroke-width="2"/>'
    ),
  },
  {
    name: '万字纹',
    category: 'geometric',
    svg_path: svgWrap(
      '<path d="M15 15 L35 15 L35 22 L22 22 L22 35 L15 35 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M55 15 L75 15 L75 35 L68 35 L68 22 L55 22 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M15 55 L22 55 L22 68 L35 68 L35 75 L15 75 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M68 55 L75 55 L75 75 L55 75 L55 68 L68 68 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M38 15 L52 15 L52 28 L38 28 Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M15 38 L28 38 L28 52 L15 52 Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M38 72 L52 72 L52 85 L38 85 Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M72 38 L85 38 L85 52 L72 52 Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '蛇纹',
    category: 'animal',
    svg_path: svgWrap(
      '<path d="M10 50 C18 30 28 30 35 45 C42 60 52 60 58 45 C64 30 74 30 82 50" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M82 50 C86 42 92 42 95 48 C98 54 92 58 88 54" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="90" cy="46" r="1.5" fill="#1A2332"/>' +
        '<path d="M10 50 C14 55 8 62 5 58" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M22 38 L20 32 M28 38 L30 32" stroke="#1A2332" stroke-width="1"/>' +
        '<path d="M48 56 L46 62 M54 56 L56 62" stroke="#1A2332" stroke-width="1"/>'
    ),
  },
  {
    name: '蛙纹',
    category: 'animal',
    svg_path: svgWrap(
      '<ellipse cx="50" cy="55" rx="22" ry="18" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="42" cy="44" r="4" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="58" cy="44" r="4" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="42" cy="44" r="2" fill="#1A2332"/>' +
        '<circle cx="58" cy="44" r="2" fill="#1A2332"/>' +
        '<path d="M30 52 C22 48 14 52 16 58 C18 64 26 62 30 56" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M70 52 C78 48 86 52 84 58 C82 64 74 62 70 56" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M38 72 C34 80 28 84 24 82" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M62 72 C66 80 72 84 76 82" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M44 60 C46 58 54 58 56 60" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '螺纹',
    category: 'natural',
    svg_path: svgWrap(
      '<path d="M50 50 C50 46 54 42 58 44 C64 46 64 54 60 58 C54 64 44 62 40 56 C36 48 40 38 48 36 C58 34 66 42 66 52 C66 64 56 72 46 70 C34 68 28 56 30 46 C32 34 44 26 56 28" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<circle cx="50" cy="50" r="3" fill="#1A2332"/>' +
        '<path d="M56 28 C64 24 72 28 76 36 C80 46 76 58 68 64 C58 72 44 72 36 66 C26 58 22 44 28 34" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '禾苗纹',
    category: 'plant',
    svg_path: svgWrap(
      '<line x1="50" y1="90" x2="50" y2="45" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 60 C44 56 34 58 32 52 C30 46 38 44 42 48 C46 52 50 55 50 60Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 60 C56 56 66 58 68 52 C70 46 62 44 58 48 C54 52 50 55 50 60Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 45 C44 40 36 42 34 36 C32 30 40 28 44 32 C48 36 50 40 50 45Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 45 C56 40 64 42 66 36 C68 30 60 28 56 32 C52 36 50 40 50 45Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 30 C48 24 50 18 50 12 C50 18 52 24 50 30Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M46 28 C42 22 38 24 36 20 C40 20 44 24 46 28Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<path d="M54 28 C58 22 62 24 64 20 C60 20 56 24 54 28Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>'
    ),
  },
  {
    name: '谷粒纹',
    category: 'plant',
    svg_path: svgWrap(
      '<ellipse cx="30" cy="25" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="50" cy="20" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="70" cy="25" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="20" cy="50" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="40" cy="48" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="60" cy="48" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="80" cy="50" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="30" cy="75" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="50" cy="78" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<ellipse cx="70" cy="75" rx="6" ry="10" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<line x1="30" y1="35" x2="30" y2="40" stroke="#1A2332" stroke-width="1"/>' +
        '<line x1="50" y1="30" x2="50" y2="38" stroke="#1A2332" stroke-width="1"/>' +
        '<line x1="70" y1="35" x2="70" y2="40" stroke="#1A2332" stroke-width="1"/>'
    ),
  },
  {
    name: '星纹',
    category: 'natural',
    svg_path: svgWrap(
      '<path d="M50 8 L56 35 L84 35 L62 52 L70 80 L50 64 L30 80 L38 52 L16 35 L44 35 Z" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M50 22 L53 35 L66 35 L56 43 L59 56 L50 48 L41 56 L44 43 L34 35 L47 35 Z" fill="none" stroke="#1A2332" stroke-width="1.5"/>' +
        '<circle cx="50" cy="42" r="4" fill="#1A2332"/>'
    ),
  },
  {
    name: '锯齿纹',
    category: 'geometric',
    svg_path: svgWrap(
      '<path d="M5 30 L12 15 L19 30 L26 15 L33 30 L40 15 L47 30 L54 15 L61 30 L68 15 L75 30 L82 15 L89 30 L96 15" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M5 50 L12 35 L19 50 L26 35 L33 50 L40 35 L47 50 L54 35 L61 50 L68 35 L75 50 L82 35 L89 50 L96 35" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M5 70 L12 55 L19 70 L26 55 L33 70 L40 55 L47 70 L54 55 L61 70 L68 55 L75 70 L82 55 L89 70 L96 55" fill="none" stroke="#1A2332" stroke-width="2"/>' +
        '<path d="M5 90 L12 75 L19 90 L26 75 L33 90 L40 75 L47 90 L54 75 L61 90 L68 75 L75 90 L82 75 L89 90 L96 75" fill="none" stroke="#1A2332" stroke-width="2"/>'
    ),
  },
]

export function getDb(): Database.Database {
  if (db) return db

  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  db = new Database(DB_PATH)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('natural', 'geometric', 'animal', 'plant')),
      svg_path TEXT NOT NULL,
      thumbnail TEXT,
      is_builtin BOOLEAN NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS temp_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      svg_path TEXT NOT NULL,
      original_image TEXT NOT NULL,
      thumbnail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_patterns_category ON patterns(category);
    CREATE INDEX IF NOT EXISTS idx_patterns_name ON patterns(name);
    CREATE INDEX IF NOT EXISTS idx_temp_patterns_expires_at ON temp_patterns(expires_at);
  `)

  const count = db.prepare('SELECT COUNT(*) as cnt FROM patterns WHERE is_builtin = 1').get() as { cnt: number }
  if (count.cnt === 0) {
    const insert = db.prepare(
      'INSERT INTO patterns (name, category, svg_path, is_builtin) VALUES (?, ?, ?, 1)'
    )
    const transaction = db.transaction(() => {
      for (const p of builtinPatterns) {
        insert.run(p.name, p.category, p.svg_path)
      }
    })
    transaction()
  }

  return db
}
