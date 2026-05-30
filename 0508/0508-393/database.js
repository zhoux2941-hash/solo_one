const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'patterns.db');
let db = null;

function getDb() {
    if (!db) {
        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
    }
    return db;
}

function seedPatterns() {
    const d = getDb();
    const count = d.prepare('SELECT COUNT(*) as c FROM pattern_templates').get().c;
    if (count > 0) return;

    const patterns = [
        {
            name: '尖角星瓣', name_en: 'Sharp Star Arm',
            vertices: [[0, 0], [0.12, -0.65], [0, -1.0], [-0.12, -0.65]],
            symmetry_type: 'D', default_n: 10,
            description: '尖锐星形臂瓣，D_n下生成n角星。n=10时为经典十角星，n=8为八角星Khatam',
            category: 'star'
        },
        {
            name: '宽角星瓣', name_en: 'Wide Star Arm',
            vertices: [[0, 0], [0.22, -0.55], [0, -1.0], [-0.22, -0.55]],
            symmetry_type: 'D', default_n: 8,
            description: '宽角星形臂瓣，产生饱满的星形图案，伊斯兰Khatam常用',
            category: 'star'
        },
        {
            name: '细长星瓣', name_en: 'Slender Star Arm',
            vertices: [[0, 0], [0.08, -0.6], [0, -1.0], [-0.08, -0.6]],
            symmetry_type: 'D', default_n: 12,
            description: '细长星形臂瓣，n=12时为十二角星，象征黄道十二宫',
            category: 'star'
        },
        {
            name: '三角星瓣', name_en: 'Triangular Arm',
            vertices: [[0, 0], [0.15, -0.5], [0, -1.0]],
            symmetry_type: 'C', default_n: 6,
            description: '三角臂瓣，C_n下产生旋转方向性图案，D_n下产生六角星',
            category: 'star'
        },
        {
            name: '花瓣', name_en: 'Petal',
            vertices: [[0, 0], [0.18, -0.35], [0.12, -0.7], [0, -0.9], [-0.12, -0.7], [-0.18, -0.35]],
            symmetry_type: 'D', default_n: 10,
            description: '花瓣形臂瓣，产生玫瑰花饰，波斯装饰核心图样',
            category: 'rosette'
        },
        {
            name: '尖花瓣', name_en: 'Pointed Petal',
            vertices: [[0, 0], [0.14, -0.3], [0.06, -0.65], [0, -0.95], [-0.06, -0.65], [-0.14, -0.3]],
            symmetry_type: 'D', default_n: 8,
            description: '尖花瓣形臂瓣，交错八角星图样的基本单元',
            category: 'rosette'
        },
        {
            name: '菱形瓣', name_en: 'Diamond Arm',
            vertices: [[0, 0], [0.3, -0.45], [0, -0.9], [-0.3, -0.45]],
            symmetry_type: 'D', default_n: 2,
            description: '菱形臂瓣，基本填充元素，象征眼睛与保护',
            category: 'polygon'
        },
        {
            name: '六边形瓣', name_en: 'Hexagon Sector',
            vertices: [[0, 0], [0.4, -0.23], [0.4, -0.7], [0, -0.93], [-0.4, -0.7], [-0.4, -0.23]],
            symmetry_type: 'D', default_n: 6,
            description: '六边形1/6扇区，D_6下生成正六边形蜂巢结构',
            category: 'polygon'
        },
        {
            name: '八边形瓣', name_en: 'Octagon Sector',
            vertices: [[0, 0], [0.32, -0.32], [0.45, -0.45], [0.32, -0.72], [0, -0.85], [-0.32, -0.72], [-0.45, -0.45], [-0.32, -0.32]],
            symmetry_type: 'D', default_n: 8,
            description: '八边形1/8扇区，地毯中央框架结构的基本单元',
            category: 'polygon'
        },
        {
            name: '箭头瓣', name_en: 'Arrow Arm',
            vertices: [[0, 0], [0.2, -0.3], [0.08, -0.3], [0.08, -0.85], [0, -1.0], [-0.08, -0.85], [-0.08, -0.3], [-0.2, -0.3]],
            symmetry_type: 'D', default_n: 8,
            description: '箭头形臂瓣，伊斯兰几何中常见的方向性元素',
            category: 'girih'
        },
        {
            name: '蝴蝶瓣', name_en: 'Bowtie Sector',
            vertices: [[0, 0], [0.35, -0.2], [0.2, -0.5], [0, -0.4], [-0.2, -0.5], [-0.35, -0.2]],
            symmetry_type: 'D', default_n: 4,
            description: '蝴蝶结形扇区，Girih砖的连接元素',
            category: 'girih'
        },
        {
            name: '十边形瓣', name_en: 'Decagon Sector',
            vertices: [[0, 0], [0.25, -0.18], [0.38, -0.38], [0.35, -0.6], [0.2, -0.78], [0, -0.85], [-0.2, -0.78], [-0.35, -0.6], [-0.38, -0.38], [-0.25, -0.18]],
            symmetry_type: 'D', default_n: 10,
            description: '十边形1/10扇区，Girih砖最重要的图样',
            category: 'girih'
        }
    ];

    const insert = d.prepare(`INSERT INTO pattern_templates
        (name, name_en, vertices, symmetry_type, default_n, description, category)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const insertMany = d.transaction((items) => {
        for (const p of items) {
            insert.run(p.name, p.name_en, JSON.stringify(p.vertices),
                p.symmetry_type, p.default_n, p.description, p.category);
        }
    });
    insertMany(patterns);
}

function seedIsfahanPresets() {
    const d = getDb();
    const count = d.prepare('SELECT COUNT(*) as c FROM isfahan_presets').get().c;
    if (count > 0) return;

    const presets = [
        {
            name: '托兰吉徽章', name_en: 'Toranj Medallion',
            pattern_ids: [1, 7, 8],
            colors: {
                background: '#1a237e',
                primary: '#c62828',
                secondary: '#d4a574',
                accent: '#f5f0e8',
                outline: '#1a1a2e'
            },
            repeat_counts: { pattern_1: 10, pattern_7: 8, pattern_8: 6 },
            layout_type: 'medallion',
            description: '经典伊斯法罕中央徽章式样，以十角星为中心，菱形为边框，六边形填充角落'
        },
        {
            name: '满地花纹', name_en: 'Afshan All-Over',
            pattern_ids: [2, 8, 9],
            colors: {
                background: '#c62828',
                primary: '#1a237e',
                secondary: '#d4a574',
                accent: '#f5f0e8',
                outline: '#2c1810'
            },
            repeat_counts: { pattern_2: 8, pattern_8: 6, pattern_9: 8 },
            layout_type: 'allover',
            description: '满地花纹式样，八角星与六边形交错排列，象征无限延伸'
        },
        {
            name: '米哈拉布祈祷毯', name_en: 'Mehrabi Prayer Rug',
            pattern_ids: [3, 6, 7],
            colors: {
                background: '#d4a574',
                primary: '#1a237e',
                secondary: '#c62828',
                accent: '#f5f0e8',
                outline: '#3e2723'
            },
            repeat_counts: { pattern_3: 12, pattern_6: 8, pattern_7: 4 },
            layout_type: 'prayer',
            description: '祈祷毯式样，中央十二角星代表穹顶，尖花瓣构成壁龛轮廓'
        }
    ];

    const insert = d.prepare(`INSERT INTO isfahan_presets
        (name, name_en, pattern_ids, colors, repeat_counts, layout_type, description)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);

    const insertMany = d.transaction((items) => {
        for (const p of items) {
            insert.run(p.name, p.name_en, JSON.stringify(p.pattern_ids),
                JSON.stringify(p.colors), JSON.stringify(p.repeat_counts),
                p.layout_type, p.description);
        }
    });
    insertMany(presets);
}

function initDb() {
    const d = getDb();

    d.exec(`CREATE TABLE IF NOT EXISTS pattern_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT NOT NULL,
        vertices TEXT NOT NULL,
        symmetry_type TEXT NOT NULL,
        default_n INTEGER NOT NULL,
        description TEXT,
        category TEXT NOT NULL
    )`);

    d.exec(`CREATE TABLE IF NOT EXISTS isfahan_presets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        name_en TEXT NOT NULL,
        pattern_ids TEXT NOT NULL,
        colors TEXT NOT NULL,
        repeat_counts TEXT NOT NULL,
        layout_type TEXT NOT NULL,
        description TEXT
    )`);

    d.exec(`CREATE TABLE IF NOT EXISTS color_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        colors TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    seedPatterns();
    seedIsfahanPresets();
}

module.exports = { getDb, initDb };
