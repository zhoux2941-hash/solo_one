const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'instruments.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS instruments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    dynasty TEXT NOT NULL,
    excavation_site TEXT,
    height_cm REAL,
    width_cm REAL,
    depth_cm REAL,
    weight_kg REAL,
    decoration TEXT,
    description TEXT,
    material TEXT,
    model_type TEXT NOT NULL DEFAULT 'generic',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS dimensions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instrument_id INTEGER NOT NULL,
    label TEXT NOT NULL,
    value_cm REAL NOT NULL,
    direction TEXT,
    FOREIGN KEY (instrument_id) REFERENCES instruments(id)
  );
`);

const instruments = [
  {
    name: '西周编钟·大祀',
    type: '编钟',
    dynasty: '西周',
    excavation_site: '陕西宝鸡茹家庄',
    height_cm: 58.5,
    width_cm: 32.4,
    depth_cm: 22.8,
    weight_kg: 18.6,
    decoration: '夔龙纹、云雷纹、乳钉纹，舞部饰窃曲纹，鼓部饰变形夔龙纹，篆间饰云雷纹填地',
    description: '西周中期编钟，合瓦形腔体，平舞，直铣，于口弧形上收。钟体两面各设三排枚，每排六枚，共三十六枚。此钟音色浑厚，为祭祀孔子大典中重要礼乐器。',
    material: '青铜',
    model_type: 'bianzhong'
  },
  {
    name: '春秋编钟·仲吕',
    type: '编钟',
    dynasty: '春秋',
    excavation_site: '河南新郑李家楼',
    height_cm: 45.2,
    width_cm: 26.8,
    depth_cm: 18.5,
    weight_kg: 12.3,
    decoration: '蟠螭纹、三角云纹，枚部饰旋涡纹，篆带饰蟠螭纹，鼓部饰双鸟纹',
    description: '春秋中期编钟，形制规整，钟体修长。枚为尖锥状，舞面微拱。音律准确，可奏雅乐正声。',
    material: '青铜',
    model_type: 'bianzhong'
  },
  {
    name: '战国特磬·黄钟',
    type: '特磬',
    dynasty: '战国',
    excavation_site: '湖北随州曾侯乙墓',
    height_cm: 42.0,
    width_cm: 60.5,
    depth_cm: 4.8,
    weight_kg: 8.2,
    decoration: '素面，边缘磨制规整，上端钻孔系绳处饰弦纹两道',
    description: '战国时期特磬，石灰岩质地，音色清越悠长。磬体呈曲尺形（倨句形），上股短下股长，为祭祀时演奏雅乐之特悬乐器。',
    material: '石灰岩',
    model_type: 'teqing'
  },
  {
    name: '清代特磬·大吕',
    type: '特磬',
    dynasty: '清',
    excavation_site: '北京孔庙',
    height_cm: 38.5,
    width_cm: 55.2,
    depth_cm: 3.5,
    weight_kg: 6.8,
    decoration: '正面刻"特磬"二字，背面刻律名，边缘饰回纹带，穿孔处饰如意云纹',
    description: '清代康熙年间特磬，和阗玉琢制，为孔庙祭孔大典专用。磬体温润如脂，击之其声清越。',
    material: '和阗玉',
    model_type: 'teqing'
  },
  {
    name: '明代柷·太簇',
    type: '柷',
    dynasty: '明',
    excavation_site: '曲阜孔庙',
    height_cm: 52.0,
    width_cm: 48.0,
    depth_cm: 48.0,
    weight_kg: 15.5,
    decoration: '通体黑漆，三面绘金龙纹，一面开圆孔（音窗），底面绘海涛纹，内壁素漆',
    description: '明代柷，方形木箱，上宽下窄。三面封闭，一面开圆窗。以柷槌击内壁发声，为雅乐之始奏乐器，乐始先击柷。',
    material: '木（髹漆）',
    model_type: 'zhu'
  },
  {
    name: '清代柷·应钟',
    type: '柷',
    dynasty: '清',
    excavation_site: '北京天坛',
    height_cm: 48.5,
    width_cm: 45.0,
    depth_cm: 45.0,
    weight_kg: 13.2,
    decoration: '外施红漆，绘金云龙纹，三面雕龙，一面圆窗饰鎏金铜钉，内壁朱漆',
    description: '清代柷，形制与明代相似而稍小。为祭孔乐舞起奏之器，以独木掘成，击之发声浑厚庄重。',
    material: '木（髹漆）',
    model_type: 'zhu'
  },
  {
    name: '战国敔·夷则',
    type: '敔',
    dynasty: '战国',
    excavation_site: '湖北江陵天星观',
    height_cm: 35.0,
    width_cm: 65.0,
    depth_cm: 25.0,
    weight_kg: 10.8,
    decoration: '伏虎形，虎背刻二十七片锯齿（龃龉），虎身饰斑纹，底座饰云纹',
    description: '战国时期敔，伏虎形木雕。虎背植龃龉（锯齿状薄板），以竹籈刮之发声。为雅乐终奏之器，乐终击敔。',
    material: '木',
    model_type: 'yu'
  },
  {
    name: '清代敔·南吕',
    type: '敔',
    dynasty: '清',
    excavation_site: '北京孔庙',
    height_cm: 32.0,
    width_cm: 68.0,
    depth_cm: 22.0,
    weight_kg: 9.5,
    decoration: '伏虎木雕，通体彩绘，虎背植龃龉二十七片，虎首微昂，口部可张合，底座饰海水江崖纹',
    description: '清代敔，伏虎造型生动。祭孔大典中，乐将终时以竹籃自虎首沿龃龉逆刮三遍，示乐止之意。',
    material: '木（彩绘）',
    model_type: 'yu'
  },
  {
    name: '宋代搏拊·姑洗',
    type: '搏拊',
    dynasty: '宋',
    excavation_site: '浙江衢州南孔家庙',
    height_cm: 28.0,
    width_cm: 22.0,
    depth_cm: 22.0,
    weight_kg: 3.2,
    decoration: '鼓面蒙牛皮，施朱漆，绘金色团龙纹，鼓身饰云雷纹带，铜钉固定鼓面',
    description: '宋代搏拊，小型手鼓。演奏时以手拍击两面，为祭孔雅乐中节拍乐器，与柷敔配合使用。',
    material: '木、皮',
    model_type: 'bofu'
  },
  {
    name: '明代麾·林钟',
    type: '麾',
    dynasty: '明',
    excavation_site: '曲阜孔庙',
    height_cm: 180.0,
    width_cm: 30.0,
    depth_cm: 5.0,
    weight_kg: 2.5,
    decoration: '木杆朱漆，顶端饰龙头含珠，杆身绘金云纹，下端铜鐏，旌旗黄帛书"文德之舞"',
    description: '明代麾，祭祀乐舞指挥之旗。麾举则乐作，麾偃则乐止。为祭孔大典中乐舞总指挥之器。',
    material: '木、帛',
    model_type: 'hui'
  },
  {
    name: '西周晋鼓·蕤宾',
    type: '晋鼓',
    dynasty: '西周',
    excavation_site: '陕西扶风法门寺',
    height_cm: 85.0,
    width_cm: 65.0,
    depth_cm: 65.0,
    weight_kg: 28.0,
    decoration: '鼓面蒙牛革，鼓身红漆描金，饰双龙戏珠纹，鼓边铜钉三排，底座雕莲瓣纹',
    description: '西周晋鼓，大型立鼓。祭孔时置于殿庭，用以节制乐章节奏，声如雷霆，为八音之首。',
    material: '木、皮',
    model_type: 'jingu'
  },
  {
    name: '清代埙·无射',
    type: '埙',
    dynasty: '清',
    excavation_site: '北京故宫',
    height_cm: 8.5,
    width_cm: 7.2,
    depth_cm: 7.2,
    weight_kg: 0.35,
    decoration: '橄榄形，素面施红漆，顶设吹孔一，前设指孔五（左三右二），底面平',
    description: '清代埙，橄榄形陶制吹奏乐器。音色幽远深沉，为祭孔雅乐八音之土音。五孔可发八音，合于古制。',
    material: '陶',
    model_type: 'xun'
  }
];

const insertInstrument = db.prepare(`
  INSERT INTO instruments (name, type, dynasty, excavation_site, height_cm, width_cm, depth_cm, weight_kg, decoration, description, material, model_type)
  VALUES (@name, @type, @dynasty, @excavation_site, @height_cm, @width_cm, @depth_cm, @weight_kg, @decoration, @description, @material, @model_type)
`);

const insertDimension = db.prepare(`
  INSERT INTO dimensions (instrument_id, label, value_cm, direction)
  VALUES (@instrument_id, @label, @value_cm, @direction)
`);

const transaction = db.transaction(() => {
  const count = db.prepare('SELECT COUNT(*) as c FROM instruments').get();
  if (count.c > 0) {
    console.log('Database already seeded, skipping...');
    return;
  }

  for (const inst of instruments) {
    const result = insertInstrument.run(inst);
    const instId = result.lastInsertRowid;

    insertDimension.run({ instrument_id: instId, label: '通高', value_cm: inst.height_cm, direction: 'vertical' });
    if (inst.width_cm) insertDimension.run({ instrument_id: instId, label: '通宽', value_cm: inst.width_cm, direction: 'horizontal' });
    if (inst.depth_cm) insertDimension.run({ instrument_id: instId, label: '通深', value_cm: inst.depth_cm, direction: 'depth' });
    if (inst.weight_kg) insertDimension.run({ instrument_id: instId, label: '重量(kg)', value_cm: inst.weight_kg, direction: 'weight' });
  }

  console.log(`Seeded ${instruments.length} instruments.`);
});

transaction();
db.close();
console.log('Database initialized at:', dbPath);
