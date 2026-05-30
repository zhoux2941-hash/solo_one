import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Shape } from '../shared/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db: Database | null = null;

const DB_PATH = path.join(__dirname, '../data/sichuan-opera.db');

export async function initDatabase(): Promise<Database> {
  if (db) return db;

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '../node_modules/sql.js/dist', file)
  });

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    console.log('Database loaded from file');
  } else {
    db = new SQL.Database();
    console.log('New database created');
    createTables(db);
    seedData(db);
    saveDatabase(db);
  }

  return db;
}

function saveDatabase(database: Database): void {
  const data = database.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
}

function createTables(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      icon TEXT NOT NULL
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS characters (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      alias TEXT,
      description TEXT NOT NULL,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS sichuan_operas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      alias TEXT,
      description TEXT NOT NULL,
      plot_summary TEXT NOT NULL,
      historical_background TEXT,
      cultural_significance TEXT
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS character_opera_relations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      opera_id INTEGER NOT NULL,
      role_description TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id),
      FOREIGN KEY (opera_id) REFERENCES sichuan_operas(id),
      UNIQUE (character_id, opera_id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS face_patterns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      character_id INTEGER NOT NULL,
      pattern_type TEXT NOT NULL CHECK (pattern_type IN ('symmetric', 'asymmetric')),
      main_color TEXT NOT NULL,
      secondary_color TEXT NOT NULL,
      outline_color TEXT NOT NULL DEFAULT '#000000',
      accent_color_1 TEXT,
      accent_color_2 TEXT,
      pattern_features TEXT NOT NULL,
      pattern_shapes TEXT NOT NULL,
      reference_image TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id),
      UNIQUE (character_id)
    )
  `);

  database.run(`
    CREATE TABLE IF NOT EXISTS color_symbolism (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      color TEXT NOT NULL,
      hex TEXT NOT NULL,
      meaning TEXT NOT NULL,
      examples TEXT NOT NULL
    )
  `);

  database.run('CREATE INDEX IF NOT EXISTS idx_characters_role_id ON characters(role_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_face_patterns_character_id ON face_patterns(character_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_opera_relations_character_id ON character_opera_relations(character_id)');
  database.run('CREATE INDEX IF NOT EXISTS idx_opera_relations_opera_id ON character_opera_relations(opera_id)');
}

function seedData(database: Database): void {
  database.run(`
    INSERT INTO roles (name, description, icon) VALUES
    ('生', '男性角色，分老生、小生、武生等', '👨'),
    ('旦', '女性角色，分青衣、花旦、武旦等', '👩'),
    ('净', '花脸角色，性格鲜明的男性', '🎭'),
    ('末', '中年男性角色，多为正面人物', '🧔'),
    ('丑', '滑稽角色，分文丑、武丑', '🤡')
  `);

  database.run(`
    INSERT INTO color_symbolism (color, hex, meaning, examples) VALUES
    ('红色', '#C41E3A', '象征忠勇、正义、耿直、热情', '关羽、姜维'),
    ('白色', '#FFFFFF', '象征奸诈、多疑、阴险、狡猾', '曹操、司马懿'),
    ('黑色', '#1A1A1A', '象征刚正、勇猛、鲁莽、正直', '张飞、包拯'),
    ('蓝色', '#2E4A62', '象征刚强、骁勇、有心计', '窦尔敦、夏侯惇'),
    ('绿色', '#228B22', '象征鲁莽、暴躁、绿林好汉', '程咬金、单雄信'),
    ('黄色', '#FFD700', '象征凶猛、残暴、工于心计', '典韦、宇文成都'),
    ('紫色', '#8B008B', '象征肃穆、稳重、富有正义感', '徐延昭、专诸'),
    ('金色', '#FFD700', '象征神仙、佛祖、高人', '如来佛、二郎神'),
    ('银色', '#C0C0C0', '象征妖怪、精灵', '白骨精、蜘蛛精')
  `);

  const guanYuShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 150, 180], color: 'main', fill: true, strokeWidth: 0, layer: 'base' },
    { type: 'path', points: [200, 180, 170, 150, 230, 150], color: 'secondary', fill: true, strokeWidth: 0, layer: 'base' },
    { type: 'path', points: [200, 210, 180, 250, 220, 250], color: 'secondary', fill: true, strokeWidth: 0, layer: 'base' },
    { type: 'path', points: [200, 260, 140, 320, 260, 320], color: 'secondary', fill: true, strokeWidth: 0, layer: 'base' },
    { type: 'ellipse', points: [200, 100, 60, 30], color: 'accent1', fill: true, strokeWidth: 0, layer: 'base' },
    { type: 'path', points: [200, 180, 170, 150, 230, 150], color: 'outline', fill: false, strokeWidth: 2, layer: 'line' },
    { type: 'ellipse', points: [170, 180, 25, 35], color: 'outline', fill: false, strokeWidth: 3, layer: 'line' },
    { type: 'ellipse', points: [230, 180, 25, 35], color: 'outline', fill: false, strokeWidth: 3, layer: 'line' },
    { type: 'path', points: [200, 210, 180, 250, 220, 250], color: 'outline', fill: false, strokeWidth: 2, layer: 'line' },
    { type: 'path', points: [200, 260, 140, 320, 260, 320], color: 'outline', fill: false, strokeWidth: 2, layer: 'line' },
    { type: 'ellipse', points: [200, 100, 60, 30], color: 'outline', fill: false, strokeWidth: 2, layer: 'line' },
    { type: 'ellipse', points: [170, 180, 12, 18], color: 'outline', fill: true, strokeWidth: 0, layer: 'feature' },
    { type: 'ellipse', points: [230, 180, 12, 18], color: 'outline', fill: true, strokeWidth: 0, layer: 'feature' },
    { type: 'path', points: [150, 155, 190, 145], color: 'outline', fill: false, strokeWidth: 3, layer: 'feature' },
    { type: 'path', points: [210, 145, 250, 155], color: 'outline', fill: false, strokeWidth: 3, layer: 'feature' }
  ];

  const caoCaoShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 150, 180], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 160, 120, 120, 280, 120], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 160, 120, 120, 280, 120], color: 'outline', fill: false, strokeWidth: 2 },
    { type: 'ellipse', points: [170, 180, 10, 15], color: 'outline', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [230, 180, 10, 15], color: 'outline', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [170, 180, 30, 40], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'ellipse', points: [230, 180, 30, 40], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'path', points: [140, 150, 200, 140], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'path', points: [200, 140, 260, 150], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'path', points: [150, 220, 250, 220], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [150, 220, 250, 220], color: 'outline', fill: false, strokeWidth: 2 },
    { type: 'path', points: [180, 280, 220, 280], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 300, 160, 340, 240, 340], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 300, 160, 340, 240, 340], color: 'outline', fill: false, strokeWidth: 2 }
  ];

  const zhangFeiShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 150, 180], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [150, 140, 250, 140], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [150, 140, 250, 140], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'ellipse', points: [170, 180, 35, 45], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [230, 180, 35, 45], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [170, 180, 15, 20], color: 'outline', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [230, 180, 15, 20], color: 'outline', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [170, 180, 35, 45], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'ellipse', points: [230, 180, 35, 45], color: 'outline', fill: false, strokeWidth: 3 },
    { type: 'path', points: [130, 130, 160, 100, 190, 130], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [210, 130, 240, 100, 270, 130], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 250, 150, 280, 250, 280], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 250, 150, 280, 250, 280], color: 'outline', fill: false, strokeWidth: 2 },
    { type: 'path', points: [200, 260, 100, 300, 300, 300], color: 'outline', fill: false, strokeWidth: 4 },
    { type: 'ellipse', points: [200, 100, 50, 25], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [200, 100, 50, 25], color: 'outline', fill: false, strokeWidth: 2 }
  ];

  const diaochanShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 140, 170], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [160, 130, 240, 130], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [175, 175, 20, 30], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [225, 175, 20, 30], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 220, 170, 260, 230, 260], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 200, 190, 240, 210, 240], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [140, 200, 15, 20], color: 'accent2', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [260, 200, 15, 20], color: 'accent2', fill: true, strokeWidth: 0 }
  ];

  const baozhengShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 150, 180], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 150, 150, 100, 250, 100], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [170, 180, 25, 35], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [230, 180, 25, 35], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 220, 180, 250, 220, 250], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 260, 130, 320, 270, 320], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [200, 100, 45, 20], color: 'accent2', fill: true, strokeWidth: 0 }
  ];

  const zhaoYunShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 140, 170], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [170, 150, 230, 150], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [175, 180, 22, 32], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [225, 180, 22, 32], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 240, 180, 270, 220, 270], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 290, 170, 330, 230, 330], color: 'outline', fill: true, strokeWidth: 0 }
  ];

  const zhugeLiangShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 140, 170], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [160, 140, 240, 140], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [175, 175, 20, 30], color: 'outline', fill: false, strokeWidth: 2 },
    { type: 'ellipse', points: [225, 175, 20, 30], color: 'outline', fill: false, strokeWidth: 2 },
    { type: 'path', points: [200, 220, 180, 260, 220, 260], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 280, 160, 320, 240, 320], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [200, 100, 50, 25], color: 'accent2', fill: true, strokeWidth: 0 }
  ];

  const sunWukongShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 130, 160], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [150, 120, 250, 120], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [170, 170, 28, 38], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [230, 170, 28, 38], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 200, 140, 80, 260, 80], color: 'secondary', fill: false, strokeWidth: 3 },
    { type: 'path', points: [200, 240, 180, 270, 220, 270], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [140, 210, 15, 20], color: 'accent2', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [260, 210, 15, 20], color: 'accent2', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 300, 170, 340, 230, 340], color: 'accent1', fill: true, strokeWidth: 0 }
  ];

  const xiangYuShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 150, 180], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 140, 100, 100, 300, 100], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [170, 180, 30, 40], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [230, 180, 30, 40], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'path', points: [160, 220, 240, 220], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 260, 150, 300, 250, 300], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 320, 180, 350, 220, 350], color: 'accent1', fill: true, strokeWidth: 0 }
  ];

  const yangGuifeiShapes: Shape[] = [
    { type: 'ellipse', points: [200, 200, 145, 175], color: 'main', fill: true, strokeWidth: 0 },
    { type: 'path', points: [155, 135, 245, 135], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [175, 175, 22, 32], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [225, 175, 22, 32], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'path', points: [200, 230, 180, 270, 220, 270], color: 'secondary', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [200, 100, 55, 30], color: 'accent2', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [130, 200, 18, 22], color: 'accent1', fill: true, strokeWidth: 0 },
    { type: 'ellipse', points: [270, 200, 18, 22], color: 'accent1', fill: true, strokeWidth: 0 }
  ];

  const characters = [
    { name: '关羽', alias: '关公', roleId: 3, description: '三国时期蜀汉名将，以忠义著称',
      patternType: 'symmetric', mainColor: '#C41E3A', secondaryColor: '#000000',
      outlineColor: '#1A1A1A', accent1: '#FFD700', accent2: '#8B4513',
      patternFeatures: '红脸美髯，丹凤眼，卧蚕眉，相貌堂堂，威风凛凛。红色脸谱象征忠勇仁义',
      patternShapes: guanYuShapes },
    { name: '曹操', alias: '曹孟德', roleId: 3, description: '三国时期曹魏政权的奠基人，一代枭雄',
      patternType: 'symmetric', mainColor: '#FFFFFF', secondaryColor: '#1A1A1A',
      outlineColor: '#000000', accent1: '#C41E3A', accent2: '#FFD700',
      patternFeatures: '白脸整脸，细眉长目，面白如玉，象征奸诈多疑的代表人物',
      patternShapes: caoCaoShapes },
    { name: '张飞', alias: '张翼德', roleId: 3, description: '三国时期蜀汉名将，勇猛过人',
      patternType: 'symmetric', mainColor: '#1A1A1A', secondaryColor: '#C41E3A',
      outlineColor: '#000000', accent1: '#FFFFFF', accent2: '#FFD700',
      patternFeatures: '黑脸豹头，环眼燕颔，勇猛莽撞的典型形象',
      patternShapes: zhangFeiShapes },
    { name: '貂蝉', alias: '刁蝉', roleId: 2, description: '中国古代四大美女之一',
      patternType: 'asymmetric', mainColor: '#FFE4E1', secondaryColor: '#FFB6C1',
      outlineColor: '#8B008B', accent1: '#FF1493', accent2: '#FFD700',
      patternFeatures: '俊美的旦角脸谱，粉面含春，容貌秀丽，象征美貌与智慧',
      patternShapes: diaochanShapes },
    { name: '包拯', alias: '包青天', roleId: 5, description: '北宋名臣，以公正廉明',
      patternType: 'symmetric', mainColor: '#1A1A1A', secondaryColor: '#C41E3A',
      outlineColor: '#000000', accent1: '#FFFFFF', accent2: '#FFD700',
      patternFeatures: '黑脸如炭，眉间有月牙，象征铁面无私，公正廉明的代表',
      patternShapes: baozhengShapes },
    { name: '赵云', alias: '常山赵子龙', roleId: 1, description: '三国时期蜀汉名将，一身是胆',
      patternType: 'symmetric', mainColor: '#FFE4C4', secondaryColor: '#DEB887',
      outlineColor: '#8B4513', accent1: '#C41E3A', accent2: '#FFD700',
      patternFeatures: '生角俊扮，面如敷粉，唇若施脂，风流倜傥的勇将形象',
      patternShapes: zhaoYunShapes },
    { name: '诸葛亮', alias: '诸葛孔明', roleId: 1, description: '三国时期蜀汉丞相，智谋无双',
      patternType: 'symmetric', mainColor: '#E6E6FA', secondaryColor: '#9370DB',
      outlineColor: '#4B0082', accent1: '#FFD700', accent2: '#C41E3A',
      patternFeatures: '生角扮相，面如冠玉，头戴纶巾，手持羽扇，智慧的化身',
      patternShapes: zhugeLiangShapes },
    { name: '孙悟空', alias: '齐天大圣', roleId: 5, description: '《西游记》中的主角，神通广大',
      patternType: 'asymmetric', mainColor: '#FFD700', secondaryColor: '#C41E3A',
      outlineColor: '#1A1A1A', accent1: '#8B4513', accent2: '#228B22',
      patternFeatures: '猴脸象形，金面红毛，火眼金睛，活泼机智的美猴王形象',
      patternShapes: sunWukongShapes },
    { name: '项羽', alias: '西楚霸王', roleId: 1, description: '秦末起义军领袖，力能扛鼎',
      patternType: 'symmetric', mainColor: '#1A1A1A', secondaryColor: '#C41E3A',
      outlineColor: '#000000', accent1: '#FFD700', accent2: '#8B4513',
      patternFeatures: '霸王脸谱，黑眉大眼，气宇轩昂，英雄盖世的悲剧英雄形象',
      patternShapes: xiangYuShapes },
    { name: '杨贵妃', alias: '杨玉环', roleId: 2, description: '中国古代四大美女之一，唐玄宗宠妃',
      patternType: 'asymmetric', mainColor: '#FFF0F5', secondaryColor: '#FFB6C1',
      outlineColor: '#8B008B', accent1: '#C41E3A', accent2: '#FFD700',
      patternFeatures: '旦角俊扮，面如满月，眼如秋水，雍容华贵的美女形象',
      patternShapes: yangGuifeiShapes }
  ];

  const characterIdMap: Record<string, number> = {};
  
  characters.forEach((char) => {
    database.run(
      'INSERT INTO characters (role_id, name, alias, description) VALUES (?, ?, ?, ?)',
      [char.roleId, char.name, char.alias, char.description]
    );
    
    const charIdResult = database.exec('SELECT last_insert_rowid() as id');
    const charId = charIdResult[0].values[0][0] as number;
    characterIdMap[char.name] = charId;
    
    const shapesJson = JSON.stringify(char.patternShapes);
    
    database.run(
      `INSERT INTO face_patterns (
        character_id, pattern_type, main_color, secondary_color, 
        outline_color, accent_color_1, accent_color_2, 
        pattern_features, pattern_shapes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        charId,
        char.patternType,
        char.mainColor,
        char.secondaryColor,
        char.outlineColor,
        char.accent1,
        char.accent2,
        char.patternFeatures,
        shapesJson
      ]
    );
  });

  const operas = [
    {
      name: '三国演义',
      alias: '三国戏',
      description: '川剧三国戏是川剧传统剧目中的重要组成部分，以三国时期的历史故事为背景',
      plotSummary: '讲述了从东汉末年到西晋初年之间近百年的历史风云，反映了三国时代的政治军事斗争以及各类社会矛盾的渗透与转化',
      historicalBackground: '三国戏在清代乾隆年间已盛行于四川，是川剧搬演最多的历史题材剧目之一',
      culturalSignificance: '川剧三国戏以其独特的表演风格和鲜明的人物塑造，成为研究川剧艺术和三国文化的重要载体'
    },
    {
      name: '空城计',
      alias: null,
      description: '三国演义中的经典折子戏，展现诸葛亮的智谋',
      plotSummary: '诸葛亮因错用马谡而失掉战略要地街亭，魏将司马懿乘势引大军15万向诸葛亮所在的西城蜂拥而来。诸葛亮临危不惧，传令大开城门，还派人去城门口洒扫。诸葛亮自己则登上城楼，端坐弹琴，态度从容，琴声不乱。司马懿见状，疑有埋伏，不敢冒进，便下令退兵。',
      historicalBackground: '空城计是川剧三国戏中的经典代表剧目，常作为独立折子戏演出',
      culturalSignificance: '此剧通过夸张的表演和细腻的唱腔，塑造了诸葛亮智计百出的艺术形象'
    },
    {
      name: '长坂坡',
      alias: null,
      description: '三国演义中赵云单骑救主的经典故事',
      plotSummary: '曹操大军南下，刘备兵败新野，携民渡江。赵云负责保护刘备家小，在长坂坡与曹军展开激战。赵云单枪匹马冲入曹军重围，七进七出，救出幼主阿斗。张飞在长坂桥断后，一声怒吼，吓退曹操百万大军。',
      historicalBackground: '长坂坡是川剧武生戏的代表剧目，以繁重的唱做念打著称',
      culturalSignificance: '剧中赵云的忠勇形象深入人心，是川剧武生行当的经典角色'
    },
    {
      name: '华容道',
      alias: '挡曹',
      description: '三国演义中关羽义释曹操的经典故事',
      plotSummary: '赤壁之战后，曹操兵败，率残部走华容道。诸葛亮派关羽在此埋伏。关羽念及曹操昔日厚待之恩，不顾军令状，放走了曹操。诸葛亮欲按军法从事，刘备求情，关羽才得以免死。',
      historicalBackground: '华容道是川剧净角戏的代表剧目，关羽的红脸脸谱在此剧中得到充分展现',
      culturalSignificance: '此剧通过关羽"义薄云天"的形象，宣扬了中国传统的忠义思想'
    },
    {
      name: '捉放曹',
      alias: null,
      description: '三国演义中曹操杀吕伯奢的故事，展现曹操多疑的性格',
      plotSummary: '曹操谋刺董卓未遂，逃亡途中被中牟县令陈宫擒获。陈宫感其忠义，弃官与曹操一同逃亡。途中曹操误杀吕伯奢全家，并说出"宁教我负天下人，休教天下人负我"的名言。陈宫见状，知曹操为人奸诈，便悄然离去。',
      historicalBackground: '捉放曹是川剧老生和花脸的应工戏，唱做并重',
      culturalSignificance: '剧中曹操的白脸脸谱成为奸诈多疑的典型代表'
    },
    {
      name: '击鼓骂曹',
      alias: null,
      description: '三国演义中祢衡裸衣骂曹操的故事',
      plotSummary: '孔融荐祢衡于曹操，曹操不礼，祢衡当众裸衣击鼓，痛骂曹操。曹操欲借刀杀人，派祢衡出使荆州，劝降刘表。祢衡至荆州，又辱骂刘表，刘表又派祢衡去见黄祖。最终祢衡被黄祖所杀。',
      historicalBackground: '此剧是川剧老生的唱功戏，以大段唱腔著称',
      culturalSignificance: '剧中祢衡的刚直不阿与曹操的奸诈形成鲜明对比'
    },
    {
      name: '西厢记',
      alias: '红娘',
      description: '元代王实甫创作的杂剧，是中国古典戏曲的经典之作',
      plotSummary: '书生张君瑞在普救寺偶遇崔相国之女崔莺莺，二人一见钟情。叛军孙飞虎兵围普救寺，欲强抢崔莺莺。崔夫人宣称能退贼者愿以女相许。张生修书请好友白马将军解围。然崔夫人事后反悔，让二人以兄妹相称。在丫鬟红娘的帮助下，二人私订终身。崔夫人得知后，逼迫张生进京赶考。张生得中状元，终与莺莺团圆。',
      historicalBackground: '西厢记在川剧舞台上常演不衰，尤以"红娘"一折最为著名',
      culturalSignificance: '此剧歌颂了青年男女对自由爱情的追求，红娘成为聪明机智的丫鬟形象的代表'
    },
    {
      name: '贵妃醉酒',
      alias: '百花亭',
      description: '川剧旦角的代表剧目，展现杨贵妃的雍容华贵与内心幽怨',
      plotSummary: '唐玄宗与杨贵妃相约在百花亭赏花饮酒。杨贵妃先到百花亭等候，久候玄宗不至，忽报玄宗已幸江妃宫。杨贵妃闻讯，懊恼欲绝，万端愁绪无以排遣，遂命高力士、裴力士添杯奉盏，饮至大醉，怅然返宫。',
      historicalBackground: '贵妃醉酒是川剧青衣行当的经典剧目，以优美的唱腔和细腻的表演著称',
      culturalSignificance: '此剧通过杨贵妃的醉态，细腻地刻画了宫廷女性的哀怨与无奈，具有很高的艺术价值'
    },
    {
      name: '霸王别姬',
      alias: '乌江渡',
      description: '楚汉相争末期，项羽兵败垓下的悲壮故事',
      plotSummary: '刘邦与项羽约定以鸿沟为界，中分天下。刘邦随即背约东进，围项羽于垓下。项羽兵少粮尽，夜闻四面楚歌，以为楚地尽失。虞姬为项羽舞剑助兴，歌罢自刎，以断项羽后顾之私情。项羽率八百骑突围，至乌江边，自觉无颜见江东父老，自刎而死。',
      historicalBackground: '霸王别姬是川剧花脸和青衣的合演剧目，唱做并重',
      culturalSignificance: '此剧塑造了项羽悲剧英雄的形象和虞姬忠贞不渝的品格，具有震撼人心的艺术力量'
    },
    {
      name: '三打白骨精',
      alias: '白骨洞',
      description: '西游记中的经典故事，展现孙悟空的神通广大与火眼金睛',
      plotSummary: '唐僧师徒西天取经，途经白虎岭。白骨精为吃唐僧肉，先后变化为村姑、老妇、老翁迷惑唐僧，均被孙悟空识破并打死。唐僧不辨人妖，反责怪孙悟空恣意行凶，将其逐走。白骨精趁机擒走唐僧。猪八戒去花果山请回孙悟空，孙悟空救出唐僧，消灭白骨精，师徒和好如初。',
      historicalBackground: '三打白骨精是川剧武丑的代表剧目，以特技表演著称',
      culturalSignificance: '此剧通过孙悟空的形象，歌颂了嫉恶如仇、勇敢机智的斗争精神'
    },
    {
      name: '铡美案',
      alias: '秦香莲',
      description: '北宋包拯秉公执法，怒斩驸马陈世美的故事',
      plotSummary: '陈世美进京赴试，得中状元，被招为驸马。其发妻秦香莲携儿女进京寻夫，陈世美不仅不认，反而派韩琦追杀。韩琦不忍杀害无辜，自刎身亡。秦香莲悲愤已极，到开封府告状。包拯不畏权势，秉公而断，欲将陈世美正法。皇姑、国太前来说情，包拯均不为所动，终将陈世美铡死。',
      historicalBackground: '铡美案是川剧花脸（黑头）的代表剧目，以唱功著称',
      culturalSignificance: '此剧塑造了包拯铁面无私、刚正不阿的清官形象，表达了人民对公平正义的向往'
    },
    {
      name: '打龙袍',
      alias: '仁宗认母',
      description: '北宋包拯断案，李太后还朝的故事',
      plotSummary: '北宋仁宗年间，包拯陈州放粮，遇瞎婆告状，乃知是真宗皇帝的李宸妃。李妃因生下太子被刘后嫉妒，陷害出逃，流落民间。包拯带李妃还朝，设计让仁宗认母。刘后及郭槐阴谋败露，受到惩处。李太后还朝后，命包拯抽打仁宗龙袍，以代责罚。',
      historicalBackground: '打龙袍是川剧花脸（黑头）和老旦的合演剧目',
      culturalSignificance: '此剧与铡美案等包拯戏共同构成了川剧的"包公戏"系列'
    }
  ];

  const operaIdMap: Record<string, number> = {};
  
  operas.forEach((opera) => {
    database.run(
      `INSERT INTO sichuan_operas (name, alias, description, plot_summary, historical_background, cultural_significance) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [opera.name, opera.alias, opera.description, opera.plotSummary, opera.historicalBackground, opera.culturalSignificance]
    );
    const operaIdResult = database.exec('SELECT last_insert_rowid() as id');
    const operaId = operaIdResult[0].values[0][0] as number;
    operaIdMap[opera.name] = operaId;
  });

  const relations = [
    { character: '关羽', opera: '三国演义', role: '主要角色，忠义的代表' },
    { character: '关羽', opera: '华容道', role: '主角，义释曹操' },
    { character: '关羽', opera: '长坂坡', role: '配角，江夏求援' },
    { character: '曹操', opera: '三国演义', role: '主要角色，一代枭雄' },
    { character: '曹操', opera: '华容道', role: '主角，兵败被释' },
    { character: '曹操', opera: '捉放曹', role: '主角，杀吕伯奢' },
    { character: '曹操', opera: '击鼓骂曹', role: '主角，被祢衡痛骂' },
    { character: '张飞', opera: '三国演义', role: '主要角色，勇猛莽撞' },
    { character: '张飞', opera: '长坂坡', role: '主角，喝退曹兵' },
    { character: '张飞', opera: '华容道', role: '配角，埋伏截击' },
    { character: '貂蝉', opera: '三国演义', role: '配角，美人计主角' },
    { character: '包拯', opera: '铡美案', role: '主角，怒斩陈世美' },
    { character: '包拯', opera: '打龙袍', role: '主角，秉公断案' },
    { character: '赵云', opera: '三国演义', role: '主要角色，一身是胆' },
    { character: '赵云', opera: '长坂坡', role: '主角，单骑救主' },
    { character: '诸葛亮', opera: '三国演义', role: '主要角色，智慧的化身' },
    { character: '诸葛亮', opera: '空城计', role: '主角，智退司马懿' },
    { character: '诸葛亮', opera: '华容道', role: '配角，布局设伏' },
    { character: '孙悟空', opera: '三打白骨精', role: '主角，火眼金睛识妖魔' },
    { character: '项羽', opera: '霸王别姬', role: '主角，悲剧英雄' },
    { character: '杨贵妃', opera: '贵妃醉酒', role: '主角，深宫哀怨' }
  ];

  relations.forEach((rel) => {
    const charId = characterIdMap[rel.character];
    const operaId = operaIdMap[rel.opera];
    if (charId && operaId) {
      database.run(
        `INSERT INTO character_opera_relations (character_id, opera_id, role_description) 
         VALUES (?, ?, ?)`,
        [charId, operaId, rel.role]
      );
    }
  });
}

export function getDb(): Database {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}
