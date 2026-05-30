import initSqlJs from 'sql.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: any = null;

export async function initDatabase() {
  const SQL = await initSqlJs();
  const dbPath = path.resolve(__dirname, '../../data/wadang.db');
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
    saveDatabase();
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS pattern_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      subtype TEXT NOT NULL,
      era TEXT NOT NULL,
      era_range TEXT,
      description TEXT,
      features TEXT,
      FOREIGN KEY (category_id) REFERENCES pattern_categories(id)
    );

    CREATE TABLE IF NOT EXISTS feature_vectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pattern_id INTEGER NOT NULL,
      feature_name TEXT NOT NULL,
      weight REAL NOT NULL,
      description TEXT,
      FOREIGN KEY (pattern_id) REFERENCES patterns(id)
    );
  `);
}

function seedData() {
  const categories = [
    ['云纹', '以云朵卷曲形态为主题的瓦当纹饰，线条流畅优美'],
    ['文字瓦当', '以吉祥文字为主体内容的瓦当，常见四字阳文'],
    ['四神纹', '以青龙、白虎、朱雀、玄武四灵为主题的瓦当纹饰'],
    ['葵纹', '以葵花花瓣形态为原型的瓦当纹饰，呈放射状分布'],
    ['动物纹', '以动物形象为主题的瓦当纹饰，形象生动自然'],
    ['几何纹', '以几何图形重复排列为主题的瓦当纹饰，规整有序'],
  ];

  const insertCategory = db.prepare('INSERT INTO pattern_categories (type, description) VALUES (?, ?)');
  for (const cat of categories) {
    insertCategory.run([cat[0], cat[1]]);
  }
  insertCategory.free();

  const patterns = [
    [1, '卷云纹', '西汉', '西汉中期至晚期', '卷曲如云，线条流畅圆润，极具装饰美感', 'curvature:0.9,radial_balance:0.7,center_focus:0.6'],
    [1, '羊角形云纹', '西汉', '西汉早期至中期', '形如羊角卷曲，对称分布，造型优美', 'curvature:0.85,radial_balance:0.9,center_focus:0.5'],
    [1, '蘑菇形云纹', '西汉', '西汉中期', '云头圆润如蘑菇，柄部细长，形态独特', 'curvature:0.7,radial_balance:0.6,center_focus:0.7'],
    [2, '长生无极', '西汉', '西汉中期', '四字阳文，字体规整，笔画粗壮有力', 'curvature:0.3,radial_balance:0.8,center_focus:0.9'],
    [2, '长乐未央', '西汉', '西汉早中期', '四字阳文，布局对称，笔画秀美流畅', 'curvature:0.3,radial_balance:0.85,center_focus:0.85'],
    [2, '汉并天下', '西汉', '西汉早期', '四字阳文，气势雄浑，笔画遒劲刚健', 'curvature:0.2,radial_balance:0.75,center_focus:0.9'],
    [3, '青龙瓦当', '西汉', '西汉中晚期', '龙纹矫健，鳞甲分明，动态感极强', 'curvature:0.8,radial_balance:0.7,center_focus:0.6'],
    [3, '白虎瓦当', '西汉', '西汉中晚期', '虎纹威猛，线条刚劲有力，气势磅礴', 'curvature:0.75,radial_balance:0.65,center_focus:0.6'],
    [3, '朱雀瓦当', '西汉', '西汉中期', '凤鸟展翅，线条优美流畅，灵动飘逸', 'curvature:0.85,radial_balance:0.7,center_focus:0.55'],
    [3, '玄武瓦当', '东汉', '东汉早期', '龟蛇合体，构图稳重，线条繁密精致', 'curvature:0.7,radial_balance:0.8,center_focus:0.7'],
    [4, '八瓣葵纹', '西汉', '西汉早期', '八瓣均匀分布，花瓣饱满，放射对称', 'curvature:0.6,radial_balance:0.95,center_focus:0.8'],
    [4, '变体葵纹', '西汉', '西汉中期', '花瓣变形，线条灵动自由，富有变化', 'curvature:0.65,radial_balance:0.8,center_focus:0.75'],
    [5, '鹿纹瓦当', '西汉', '西汉早期', '鹿纹灵动，形象生动自然，姿态优雅', 'curvature:0.7,radial_balance:0.55,center_focus:0.5'],
    [5, '鱼纹瓦当', '东汉', '东汉中期', '鱼纹简洁，线条圆润，形态饱满', 'curvature:0.75,radial_balance:0.6,center_focus:0.5'],
    [6, '网格纹瓦当', '西汉', '西汉早期', '交叉网格，排列规整有序，结构严谨', 'curvature:0.1,radial_balance:0.9,center_focus:0.7'],
    [6, '菱形纹瓦当', '东汉', '东汉中期', '菱形重复排列，几何感强，节奏明快', 'curvature:0.2,radial_balance:0.85,center_focus:0.6'],
  ];

  const insertPattern = db.prepare(
    'INSERT INTO patterns (category_id, subtype, era, era_range, description, features) VALUES (?, ?, ?, ?, ?, ?)'
  );
  for (const p of patterns) {
    insertPattern.run([p[0], p[1], p[2], p[3], p[4], p[5]]);
  }
  insertPattern.free();

  const featureVectors = [
    [1, 'circular_symmetry', 0.8, '卷云纹具有较高的圆对称性'],
    [1, 'line_density', 0.6, '线条密度适中'],
    [1, 'curvature', 0.9, '曲线弧度极高'],
    [1, 'radial_balance', 0.7, '径向平衡较好'],
    [1, 'center_focus', 0.6, '中心聚焦度中等'],
    [1, 'edge_complexity', 0.7, '边缘复杂度较高'],
    [2, 'circular_symmetry', 0.9, '羊角云纹高度圆对称'],
    [2, 'line_density', 0.5, '线条密度较低'],
    [2, 'curvature', 0.85, '曲线弧度高'],
    [2, 'radial_balance', 0.9, '径向平衡极高'],
    [2, 'center_focus', 0.5, '中心聚焦度偏低'],
    [2, 'edge_complexity', 0.6, '边缘复杂度中等'],
    [3, 'circular_symmetry', 0.6, '蘑菇云纹对称性一般'],
    [3, 'line_density', 0.5, '线条密度较低'],
    [3, 'curvature', 0.7, '曲线弧度较高'],
    [3, 'radial_balance', 0.6, '径向平衡中等'],
    [3, 'center_focus', 0.7, '中心聚焦度较高'],
    [3, 'edge_complexity', 0.5, '边缘复杂度中等'],
    [4, 'circular_symmetry', 0.8, '文字瓦当对称性高'],
    [4, 'line_density', 0.7, '笔画线条密度较高'],
    [4, 'curvature', 0.3, '文字笔画弧度低'],
    [4, 'radial_balance', 0.8, '四字布局径向平衡好'],
    [4, 'center_focus', 0.9, '文字位于中心区域'],
    [4, 'edge_complexity', 0.4, '文字边缘复杂度低'],
    [5, 'circular_symmetry', 0.85, '长乐未央布局高度对称'],
    [5, 'line_density', 0.7, '笔画密度较高'],
    [5, 'curvature', 0.3, '笔画弧度低'],
    [5, 'radial_balance', 0.85, '径向平衡很高'],
    [5, 'center_focus', 0.85, '中心聚焦度高'],
    [5, 'edge_complexity', 0.4, '边缘复杂度较低'],
    [6, 'circular_symmetry', 0.7, '汉并天下对称性尚可'],
    [6, 'line_density', 0.8, '笔画密度高'],
    [6, 'curvature', 0.2, '笔画弧度很低'],
    [6, 'radial_balance', 0.75, '径向平衡较高'],
    [6, 'center_focus', 0.9, '中心聚焦度极高'],
    [6, 'edge_complexity', 0.5, '边缘复杂度中等'],
    [7, 'circular_symmetry', 0.6, '龙纹圆对称性一般'],
    [7, 'line_density', 0.8, '鳞甲线条密度高'],
    [7, 'curvature', 0.8, '龙身曲线弧度高'],
    [7, 'radial_balance', 0.7, '构图径向平衡较好'],
    [7, 'center_focus', 0.6, '中心聚焦度中等'],
    [7, 'edge_complexity', 0.9, '鳞甲边缘极度复杂'],
    [8, 'circular_symmetry', 0.6, '虎纹圆对称性一般'],
    [8, 'line_density', 0.8, '虎纹线条密度高'],
    [8, 'curvature', 0.75, '虎身曲线弧度较高'],
    [8, 'radial_balance', 0.65, '构图径向平衡中等'],
    [8, 'center_focus', 0.6, '中心聚焦度中等'],
    [8, 'edge_complexity', 0.85, '虎纹边缘复杂度高'],
    [9, 'circular_symmetry', 0.65, '朱雀纹圆对称性尚可'],
    [9, 'line_density', 0.7, '羽毛线条密度较高'],
    [9, 'curvature', 0.85, '鸟翼曲线弧度极高'],
    [9, 'radial_balance', 0.7, '展翅构图径向平衡好'],
    [9, 'center_focus', 0.55, '中心聚焦度偏低'],
    [9, 'edge_complexity', 0.8, '羽毛边缘复杂度高'],
    [10, 'circular_symmetry', 0.7, '玄武纹圆对称性较好'],
    [10, 'line_density', 0.9, '龟蛇纹线条密度极高'],
    [10, 'curvature', 0.7, '蛇身曲线弧度较高'],
    [10, 'radial_balance', 0.8, '龟蛇合体径向平衡好'],
    [10, 'center_focus', 0.7, '中心聚焦度较高'],
    [10, 'edge_complexity', 0.85, '龟甲蛇鳞边缘复杂'],
    [11, 'circular_symmetry', 0.95, '八瓣葵纹高度圆对称'],
    [11, 'line_density', 0.5, '花瓣线条密度适中'],
    [11, 'curvature', 0.6, '花瓣弧度中等'],
    [11, 'radial_balance', 0.95, '放射状径向平衡极高'],
    [11, 'center_focus', 0.8, '花心中心聚焦度高'],
    [11, 'edge_complexity', 0.5, '花瓣边缘复杂度中等'],
    [12, 'circular_symmetry', 0.8, '变体葵纹对称性较好'],
    [12, 'line_density', 0.6, '变形花瓣密度较高'],
    [12, 'curvature', 0.65, '变形花瓣弧度较高'],
    [12, 'radial_balance', 0.8, '径向平衡较好'],
    [12, 'center_focus', 0.75, '中心聚焦度较高'],
    [12, 'edge_complexity', 0.6, '变形边缘复杂度较高'],
    [13, 'circular_symmetry', 0.5, '鹿纹圆对称性偏低'],
    [13, 'line_density', 0.6, '鹿纹线条密度适中'],
    [13, 'curvature', 0.7, '鹿角曲线弧度较高'],
    [13, 'radial_balance', 0.55, '构图径向平衡一般'],
    [13, 'center_focus', 0.5, '中心聚焦度中等'],
    [13, 'edge_complexity', 0.7, '鹿角边缘复杂度较高'],
    [14, 'circular_symmetry', 0.55, '鱼纹圆对称性一般'],
    [14, 'line_density', 0.5, '鱼纹线条密度适中'],
    [14, 'curvature', 0.75, '鱼身曲线弧度较高'],
    [14, 'radial_balance', 0.6, '构图径向平衡中等'],
    [14, 'center_focus', 0.5, '中心聚焦度中等'],
    [14, 'edge_complexity', 0.6, '鱼鳞边缘复杂度中等'],
    [15, 'circular_symmetry', 0.9, '网格纹高度圆对称'],
    [15, 'line_density', 0.9, '网格线条密度极高'],
    [15, 'curvature', 0.1, '直线网格弧度极低'],
    [15, 'radial_balance', 0.9, '网格径向平衡极高'],
    [15, 'center_focus', 0.7, '中心聚焦度较高'],
    [15, 'edge_complexity', 0.3, '网格边缘复杂度低'],
    [16, 'circular_symmetry', 0.85, '菱形纹圆对称性高'],
    [16, 'line_density', 0.8, '菱形重复密度高'],
    [16, 'curvature', 0.2, '菱形折线弧度低'],
    [16, 'radial_balance', 0.85, '菱形排列径向平衡高'],
    [16, 'center_focus', 0.6, '中心聚焦度中等'],
    [16, 'edge_complexity', 0.35, '菱形边缘复杂度较低'],
  ];

  const insertFeature = db.prepare(
    'INSERT INTO feature_vectors (pattern_id, feature_name, weight, description) VALUES (?, ?, ?, ?)'
  );
  for (const fv of featureVectors) {
    insertFeature.run([fv[0], fv[1], fv[2], fv[3]]);
  }
  insertFeature.free();
}

export function saveDatabase() {
  const dbPath = path.resolve(__dirname, '../../data/wadang.db');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

export function getDb() {
  return db;
}
