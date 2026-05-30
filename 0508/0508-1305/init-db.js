import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'greek-modes.db');

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file)
  });

  const db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS modes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_cn TEXT NOT NULL,
      greek_name TEXT,
      description TEXT NOT NULL,
      historical_context TEXT NOT NULL,
      semitone_pattern TEXT NOT NULL,
      interval_pattern TEXT NOT NULL,
      tetrachord_type TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tetrachords (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode_id INTEGER NOT NULL,
      position TEXT NOT NULL,
      semitone_pattern TEXT NOT NULL,
      interval_pattern TEXT NOT NULL,
      FOREIGN KEY (mode_id) REFERENCES modes(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS historical_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      mode_id INTEGER NOT NULL,
      author TEXT NOT NULL,
      work TEXT NOT NULL,
      citation TEXT NOT NULL,
      FOREIGN KEY (mode_id) REFERENCES modes(id)
    )
  `);

  const modes = [
    {
      name: 'Dorian',
      name_cn: '多利亚',
      greek_name: 'Δωρισμός',
      description: '多利亚调式是古希腊最核心的调式之一，被认为具有阳刚、庄重的特质。它的音阶结构为全音-全音-半音-全音-全音-全音-半音，相当于现代自然小调的升高六级。',
      historical_context: '多利亚调式以古希腊多里安部落命名，被柏拉图和亚里士多德认为是最理想的调式，适合表达勇气和节制。在斯巴达音乐中占有重要地位。',
      semitone_pattern: '2,2,1,2,2,2,1',
      interval_pattern: '1,1,1/2,1,1,1,1/2',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '2,2,1', interval_pattern: '1,1,1/2' },
        { position: 'upper', semitone_pattern: '2,2,1', interval_pattern: '1,1,1/2' }
      ],
      references: [
        { author: '柏拉图', work: '理想国', citation: '多利亚调式能够激发勇气和节制，是护卫者应该使用的调式。' },
        { author: '亚里士多德', work: '政治学', citation: '多利亚调式居于其他调式之间，具有庄重的特质，适合青年人学习。' },
        { author: '阿里斯托克塞努斯', work: '和声原理', citation: '多利亚调式的两个四音列均为全音-全音-半音结构，中间以一个全音相隔。' }
      ]
    },
    {
      name: 'Phrygian',
      name_cn: '弗里吉亚',
      greek_name: 'Φρύγιος',
      description: '弗里吉亚调式以半音开始，具有独特的东方色彩。结构为半音-全音-全音-全音-全音-半音-全音，相当于现代弗里吉亚调式。',
      historical_context: '弗里吉亚调式源自小亚细亚的弗里吉亚地区，被认为具有狂热和激情的特质。常与酒神狄俄尼索斯的崇拜仪式相关联。',
      semitone_pattern: '1,2,2,2,2,1,2',
      interval_pattern: '1/2,1,1,1,1,1/2,1',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '1,2,2', interval_pattern: '1/2,1,1' },
        { position: 'upper', semitone_pattern: '1,2,2', interval_pattern: '1/2,1,1' }
      ],
      references: [
        { author: '柏拉图', work: '理想国', citation: '弗里吉亚调式过于柔婉，容易使人软弱，不适合城邦的护卫者。' },
        { author: '普鲁塔克', work: '论音乐', citation: '弗里吉亚调式与酒神仪式密切相关，能够唤起狂热的情感。' }
      ]
    },
    {
      name: 'Lydian',
      name_cn: '利底亚',
      greek_name: 'Λύδιος',
      description: '利底亚调式以其明亮的色彩著称，结构为全音-全音-全音-半音-全音-全音-半音，相当于现代利底亚调式（升高四级的大调）。',
      historical_context: '利底亚调式源自小亚细亚的利底亚王国，被认为具有哀伤和女性化的特质。在古希腊悲剧中常用于表达悲痛情感。',
      semitone_pattern: '2,2,2,1,2,2,1',
      interval_pattern: '1,1,1,1/2,1,1,1/2',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '2,2,2', interval_pattern: '1,1,1' },
        { position: 'upper', semitone_pattern: '1,2,2', interval_pattern: '1/2,1,1' }
      ],
      references: [
        { author: '柏拉图', work: '理想国', citation: '利底亚调式适合表达悲伤，与宴饮和放纵相关，应该被排除。' },
        { author: '亚里士多德', work: '问题篇', citation: '利底亚调式的高音四音列与其他调式不同，形成了独特的色彩。' }
      ]
    },
    {
      name: 'Mixolydian',
      name_cn: '混合利底亚',
      greek_name: 'Μιξολύδιος',
      description: '混合利底亚调式结合了利底亚和多利亚的特征，结构为全音-半音-全音-全音-全音-半音-全音，相当于现代混合利底亚调式（降低七级的大调）。',
      historical_context: '混合利底亚调式被认为具有放松和感性的特质，常用于抒情诗歌和宴会音乐。',
      semitone_pattern: '2,1,2,2,2,1,2',
      interval_pattern: '1,1/2,1,1,1,1/2,1',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '2,1,2', interval_pattern: '1,1/2,1' },
        { position: 'upper', semitone_pattern: '2,1,2', interval_pattern: '1,1/2,1' }
      ],
      references: [
        { author: '柏拉图', work: '理想国', citation: '混合利底亚调式过于松弛，容易使人沉迷于享乐。' },
        { author: '阿里斯托克塞努斯', work: '和声原理', citation: '混合利底亚调式的四音列以全音-半音-全音为特征。' }
      ]
    },
    {
      name: 'Hypodorian',
      name_cn: '下多利亚',
      greek_name: 'Ὑποδώριος',
      description: '下多利亚调式是多利亚调式的下方四度移调形式，结构为全音-全音-半音-全音-全音-半音-全音，相当于现代自然小调。',
      historical_context: '下多利亚调式在希腊化时期被系统化，属于托勒密所说的"副调式"（plagal modes），与主调式（authentic modes）相对应。',
      semitone_pattern: '2,2,1,2,2,1,2',
      interval_pattern: '1,1,1/2,1,1,1/2,1',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '2,2,1', interval_pattern: '1,1,1/2' },
        { position: 'upper', semitone_pattern: '2,2,1', interval_pattern: '1,1,1/2' }
      ],
      references: [
        { author: '托勒密', work: '和声', citation: '副调式是主调式的下方四度移调，扩展了音乐的表现力。' },
        { author: '阿里庇乌斯', work: '音乐导论', citation: '下多利亚调式适合表达平静和内省的情感。' }
      ]
    },
    {
      name: 'Hypophrygian',
      name_cn: '下弗里吉亚',
      greek_name: 'Ὑποφρύγιος',
      description: '下弗里吉亚调式是弗里吉亚调式的下方四度移调，结构为全音-半音-全音-全音-半音-全音-全音。',
      historical_context: '下弗里吉亚调式作为副调式，在古希腊晚期和拜占庭音乐中占有重要地位。',
      semitone_pattern: '2,1,2,2,1,2,2',
      interval_pattern: '1,1/2,1,1,1/2,1,1',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '2,1,2', interval_pattern: '1,1/2,1' },
        { position: 'upper', semitone_pattern: '2,1,2', interval_pattern: '1,1/2,1' }
      ],
      references: [
        { author: '托勒密', work: '和声', citation: '下弗里吉亚调式的音域比主弗里吉亚调式低四度。' },
        { author: '曼努埃尔·布里恩尼乌斯', work: '和声', citation: '副调式在宗教音乐中被广泛使用。' }
      ]
    },
    {
      name: 'Hypolydian',
      name_cn: '下利底亚',
      greek_name: 'Ὑπολύδιος',
      description: '下利底亚调式是利底亚调式的下方四度移调，结构为半音-全音-全音-半音-全音-全音-全音。',
      historical_context: '下利底亚调式在中世纪教会音乐中发展为"利底亚调式"，但实际上与古希腊利底亚有所不同。',
      semitone_pattern: '1,2,2,1,2,2,2',
      interval_pattern: '1/2,1,1,1/2,1,1,1',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '1,2,2', interval_pattern: '1/2,1,1' },
        { position: 'upper', semitone_pattern: '1,2,2', interval_pattern: '1/2,1,1' }
      ],
      references: [
        { author: '托勒密', work: '和声', citation: '副调式系统完善了古希腊的调式体系。' },
        { author: '波爱修斯', work: '音乐的教化', citation: '古希腊的调式理论影响了整个西方音乐传统。' }
      ]
    },
    {
      name: 'Hypomixolydian',
      name_cn: '下混合利底亚',
      greek_name: 'Ὑπομιξολύδιος',
      description: '下混合利底亚调式是混合利底亚调式的下方四度移调，结构为全音-全音-半音-全音-全音-全音-半音。',
      historical_context: '下混合利底亚调式在中世纪发展为"伊奥尼亚调式"，即现代大调的前身。',
      semitone_pattern: '2,2,1,2,2,2,1',
      interval_pattern: '1,1,1/2,1,1,1,1/2',
      tetrachord_type: 'diatonic',
      tetrachords: [
        { position: 'lower', semitone_pattern: '2,2,1', interval_pattern: '1,1,1/2' },
        { position: 'upper', semitone_pattern: '2,2,1', interval_pattern: '1,1,1/2' }
      ],
      references: [
        { author: '托勒密', work: '和声', citation: '八种调式构成了完整的古希腊调式体系。' },
        { author: '圭多·达雷佐', work: '微言大义', citation: '我沿用了古希腊的调式理论，但进行了系统的整理。' }
      ]
    }
  ];

  modes.forEach((mode, index) => {
    db.run(
      'INSERT INTO modes (name, name_cn, greek_name, description, historical_context, semitone_pattern, interval_pattern, tetrachord_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [mode.name, mode.name_cn, mode.greek_name, mode.description, mode.historical_context, mode.semitone_pattern, mode.interval_pattern, mode.tetrachord_type]
    );
    const modeId = index + 1;

    mode.tetrachords.forEach(tetrachord => {
      db.run(
        'INSERT INTO tetrachords (mode_id, position, semitone_pattern, interval_pattern) VALUES (?, ?, ?, ?)',
        [modeId, tetrachord.position, tetrachord.semitone_pattern, tetrachord.interval_pattern]
      );
    });

    mode.references.forEach(ref => {
      db.run(
        'INSERT INTO historical_references (mode_id, author, work, citation) VALUES (?, ?, ?, ?)',
        [modeId, ref.author, ref.work, ref.citation]
      );
    });
  });

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);

  console.log('Database created successfully at', dbPath);
  console.log('Inserted', modes.length, 'modes');

  db.close();
}

initDatabase().catch(err => {
  console.error('Error initializing database:', err);
  process.exit(1);
});
