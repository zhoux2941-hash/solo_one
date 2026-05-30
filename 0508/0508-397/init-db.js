const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const starsData = [
  { name: '北极星', ra: 37.95, dec: 89.26, magnitude: 1.98, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '勾陈一' },
  { name: '织女星', ra: 279.23, dec: 38.78, magnitude: 0.03, mansion: '牛宿', enclosure: '天市垣', chineseName: '织女一' },
  { name: '牛郎星', ra: 297.70, dec: 8.87, magnitude: 0.77, mansion: '牛宿', enclosure: '天市垣', chineseName: '河鼓二' },
  { name: '天狼星', ra: 101.29, dec: -16.72, magnitude: -1.46, mansion: '井宿', enclosure: '太微垣', chineseName: '天狼' },
  { name: '角宿一', ra: 201.29, dec: -11.16, magnitude: 0.98, mansion: '角宿', enclosure: '太微垣', chineseName: '角宿一' },
  { name: '心宿二', ra: 247.35, dec: -26.43, magnitude: 0.96, mansion: '心宿', enclosure: '天市垣', chineseName: '心宿二' },
  { name: '参宿四', ra: 88.79, dec: 7.41, magnitude: 0.42, mansion: '参宿', enclosure: '紫微垣', chineseName: '参宿四' },
  { name: '参宿七', ra: 78.63, dec: -8.20, magnitude: 0.13, mansion: '参宿', enclosure: '紫微垣', chineseName: '参宿七' },
  { name: '毕宿五', ra: 68.98, dec: 16.51, magnitude: 0.85, mansion: '毕宿', enclosure: '紫微垣', chineseName: '毕宿五' },
  { name: '北河三', ra: 116.33, dec: 5.24, magnitude: 1.16, mansion: '井宿', enclosure: '太微垣', chineseName: '北河三' },
  { name: '轩辕十四', ra: 152.09, dec: -11.97, magnitude: 1.35, mansion: '星宿', enclosure: '太微垣', chineseName: '轩辕十四' },
  { name: '大角星', ra: 213.92, dec: 19.05, magnitude: -0.05, mansion: '亢宿', enclosure: '太微垣', chineseName: '大角' },
  { name: '天津四', ra: 310.36, dec: 45.28, magnitude: 1.25, mansion: '女宿', enclosure: '天市垣', chineseName: '天津四' },
  { name: '南门二', ra: 219.90, dec: -60.83, magnitude: -0.27, mansion: '角宿', enclosure: '太微垣', chineseName: '南门二' },
  { name: '老人星', ra: 95.67, dec: -52.69, magnitude: -0.72, mansion: '井宿', enclosure: '太微垣', chineseName: '老人' },
  { name: '水委一', ra: 25.29, dec: -57.24, magnitude: 0.46, mansion: '室宿', enclosure: '紫微垣', chineseName: '水委一' },
  { name: '马腹一', ra: 196.45, dec: -59.69, magnitude: 0.61, mansion: '轸宿', enclosure: '太微垣', chineseName: '马腹一' },
  { name: '河鼓一', ra: 295.47, dec: 6.15, magnitude: 1.96, mansion: '牛宿', enclosure: '天市垣', chineseName: '河鼓一' },
  { name: '河鼓三', ra: 299.16, dec: 10.36, magnitude: 2.22, mansion: '牛宿', enclosure: '天市垣', chineseName: '河鼓三' },
  { name: '北斗一', ra: 165.46, dec: 61.75, magnitude: 1.79, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '天枢' },
  { name: '北斗二', ra: 168.96, dec: 56.38, magnitude: 2.37, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '天璇' },
  { name: '北斗三', ra: 173.54, dec: 53.70, magnitude: 2.47, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '天玑' },
  { name: '北斗四', ra: 178.46, dec: 57.03, magnitude: 3.31, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '天权' },
  { name: '北斗五', ra: 183.77, dec: 55.96, magnitude: 1.77, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '玉衡' },
  { name: '北斗六', ra: 188.76, dec: 53.69, magnitude: 2.27, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '开阳' },
  { name: '北斗七', ra: 193.51, dec: 49.31, magnitude: 1.86, mansion: '紫微垣', enclosure: '紫微垣', chineseName: '摇光' },
  { name: '五帝座一', ra: 176.46, dec: 14.67, magnitude: 2.23, mansion: '太微垣', enclosure: '太微垣', chineseName: '五帝座一' },
  { name: '太子星', ra: 172.67, dec: 11.90, magnitude: 3.04, mansion: '太微垣', enclosure: '太微垣', chineseName: '太子' },
  { name: '从官星', ra: 174.86, dec: 11.21, magnitude: 3.47, mansion: '太微垣', enclosure: '太微垣', chineseName: '从官' },
  { name: '天市左垣', ra: 244.16, dec: 17.17, magnitude: 3.15, mansion: '天市垣', enclosure: '天市垣', chineseName: '天市左垣一' },
  { name: '天市右垣', ra: 253.40, dec: 20.52, magnitude: 2.84, mansion: '天市垣', enclosure: '天市垣', chineseName: '天市右垣一' },
  { name: '箕宿一', ra: 272.66, dec: -26.57, magnitude: 3.27, mansion: '箕宿', enclosure: '天市垣', chineseName: '箕宿一' },
  { name: '尾宿一', ra: 266.89, dec: -32.26, magnitude: 2.92, mansion: '尾宿', enclosure: '天市垣', chineseName: '尾宿一' },
  { name: '房宿一', ra: 252.52, dec: -29.47, magnitude: 3.60, mansion: '房宿', enclosure: '天市垣', chineseName: '房宿一' },
  { name: '氐宿一', ra: 234.93, dec: -19.01, magnitude: 2.86, mansion: '氐宿', enclosure: '太微垣', chineseName: '氐宿一' },
  { name: '亢宿一', ra: 216.88, dec: -4.06, magnitude: 3.11, mansion: '亢宿', enclosure: '太微垣', chineseName: '亢宿一' },
  { name: '轸宿一', ra: 209.56, dec: -18.80, magnitude: 2.79, mansion: '轸宿', enclosure: '太微垣', chineseName: '轸宿一' },
  { name: '翼宿一', ra: 203.81, dec: -23.22, magnitude: 3.44, mansion: '翼宿', enclosure: '太微垣', chineseName: '翼宿一' },
  { name: '张宿一', ra: 191.26, dec: -27.54, magnitude: 3.52, mansion: '张宿', enclosure: '太微垣', chineseName: '张宿一' },
  { name: '星宿一', ra: 180.46, dec: -34.39, magnitude: 2.93, mansion: '星宿', enclosure: '太微垣', chineseName: '星宿一' },
  { name: '柳宿一', ra: 172.64, dec: -25.66, magnitude: 3.34, mansion: '柳宿', enclosure: '太微垣', chineseName: '柳宿一' },
  { name: '鬼宿一', ra: 140.11, dec: 16.43, magnitude: 3.17, mansion: '鬼宿', enclosure: '太微垣', chineseName: '鬼宿一' },
  { name: '井宿一', ra: 109.70, dec: 10.57, magnitude: 2.98, mansion: '井宿', enclosure: '太微垣', chineseName: '井宿一' },
  { name: '参宿一', ra: 85.20, dec: -1.94, magnitude: 1.70, mansion: '参宿', enclosure: '紫微垣', chineseName: '参宿一' },
  { name: '参宿二', ra: 86.35, dec: -1.20, magnitude: 1.77, mansion: '参宿', enclosure: '紫微垣', chineseName: '参宿二' },
  { name: '参宿三', ra: 87.29, dec: -0.30, magnitude: 2.25, mansion: '参宿', enclosure: '紫微垣', chineseName: '参宿三' },
  { name: '觜宿一', ra: 90.89, dec: 20.82, magnitude: 4.18, mansion: '觜宿', enclosure: '紫微垣', chineseName: '觜宿一' },
  { name: '毕宿一', ra: 63.23, dec: 9.62, magnitude: 3.40, mansion: '毕宿', enclosure: '紫微垣', chineseName: '毕宿一' },
  { name: '昴宿一', ra: 56.01, dec: 23.98, magnitude: 3.77, mansion: '昴宿', enclosure: '紫微垣', chineseName: '昴宿一' },
  { name: '胃宿一', ra: 46.83, dec: 14.22, magnitude: 3.31, mansion: '胃宿', enclosure: '紫微垣', chineseName: '胃宿一' },
  { name: '娄宿一', ra: 39.91, dec: 21.11, magnitude: 2.60, mansion: '娄宿', enclosure: '紫微垣', chineseName: '娄宿一' },
  { name: '奎宿一', ra: 32.87, dec: 24.59, magnitude: 3.22, mansion: '奎宿', enclosure: '紫微垣', chineseName: '奎宿一' },
  { name: '壁宿一', ra: 351.52, dec: 28.03, magnitude: 3.26, mansion: '壁宿', enclosure: '紫微垣', chineseName: '壁宿一' },
  { name: '室宿一', ra: 354.77, dec: 12.83, magnitude: 3.34, mansion: '室宿', enclosure: '紫微垣', chineseName: '室宿一' },
  { name: '危宿一', ra: 346.62, dec: 12.54, magnitude: 3.52, mansion: '危宿', enclosure: '紫微垣', chineseName: '危宿一' },
  { name: '虚宿一', ra: 339.07, dec: -0.07, magnitude: 2.90, mansion: '虚宿', enclosure: '天市垣', chineseName: '虚宿一' },
  { name: '女宿一', ra: 327.27, dec: -1.48, magnitude: 3.36, mansion: '女宿', enclosure: '天市垣', chineseName: '女宿一' },
  { name: '牛宿一', ra: 308.99, dec: 14.46, magnitude: 2.96, mansion: '牛宿', enclosure: '天市垣', chineseName: '牛宿一' },
  { name: '斗宿一', ra: 300.46, dec: -26.29, magnitude: 2.88, mansion: '斗宿', enclosure: '天市垣', chineseName: '斗宿一' },
  { name: '天津一', ra: 309.11, dec: 44.96, magnitude: 2.87, mansion: '女宿', enclosure: '天市垣', chineseName: '天津一' },
  { name: '天津二', ra: 309.74, dec: 42.79, magnitude: 2.96, mansion: '女宿', enclosure: '天市垣', chineseName: '天津二' },
  { name: '天津三', ra: 311.37, dec: 40.98, magnitude: 3.35, mansion: '女宿', enclosure: '天市垣', chineseName: '天津三' },
];

const tasksData = [
  { id: 1, name: '测量角宿一的位置', description: '使用浑仪观测角宿一，记录其赤经赤纬坐标，并与星表数据对比', targetStar: '角宿一', year: 1092, location: '开封' },
  { id: 2, name: '观测北极星的地平高度', description: '在洛阳地区观测北极星，计算其地平高度，验证当地纬度', targetStar: '北极星', year: 724, location: '洛阳' },
  { id: 3, name: '寻找织女星', description: '在夏夜星空中寻找织女星，记录其在初昏时的方位角', targetStar: '织女星', year: 1279, location: '大都' },
  { id: 4, name: '观测心宿二', description: '观测心宿二（天蝎座α），记录其在中原地区的出没时间', targetStar: '心宿二', year: 1054, location: '开封' },
  { id: 5, name: '参宿四星等比较', description: '比较参宿四与参宿七的亮度差异，记录观测结果', targetStar: '参宿四', year: 630, location: '长安' },
];

const observationLogsData = [
  { id: 1, time: '1092-03-15 20:30', starName: '角宿一', ra: 201.29, dec: -11.16, altitude: 45.3, azimuth: 135.7, note: '苏颂《新仪象法要》记载观测', location: '开封' },
  { id: 2, time: '724-06-22 22:15', starName: '北极星', ra: 37.95, dec: 89.26, altitude: 34.6, azimuth: 0.0, note: '一行禅师大地测量', location: '洛阳' },
  { id: 3, time: '1279-08-10 21:00', starName: '织女星', ra: 279.23, dec: 38.78, altitude: 62.1, azimuth: 280.5, note: '郭守敬简仪观测记录', location: '大都' },
];

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });

  const db = new SQL.Database();

  db.run(`
    CREATE TABLE IF NOT EXISTS stars (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      chineseName TEXT,
      ra REAL NOT NULL,
      dec REAL NOT NULL,
      magnitude REAL,
      mansion TEXT,
      enclosure TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS observations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      time TEXT NOT NULL,
      starName TEXT NOT NULL,
      ra REAL,
      dec REAL,
      altitude REAL,
      azimuth REAL,
      note TEXT,
      location TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      targetStar TEXT,
      year INTEGER,
      location TEXT
    )
  `);

  const starStmt = db.prepare(
    'INSERT INTO stars (name, chineseName, ra, dec, magnitude, mansion, enclosure) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );
  starsData.forEach(star => {
    starStmt.run([star.name, star.chineseName, star.ra, star.dec, star.magnitude, star.mansion, star.enclosure]);
  });
  starStmt.free();

  const taskStmt = db.prepare(
    'INSERT INTO tasks (id, name, description, targetStar, year, location) VALUES (?, ?, ?, ?, ?, ?)'
  );
  tasksData.forEach(task => {
    taskStmt.run([task.id, task.name, task.description, task.targetStar, task.year, task.location]);
  });
  taskStmt.free();

  const obsStmt = db.prepare(
    'INSERT INTO observations (id, time, starName, ra, dec, altitude, azimuth, note, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  observationLogsData.forEach(obs => {
    obsStmt.run([obs.id, obs.time, obs.starName, obs.ra, obs.dec, obs.altitude, obs.azimuth, obs.note, obs.location]);
  });
  obsStmt.free();

  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(path.join(__dirname, 'data', 'star_catalog.db'), buffer);

  console.log('数据库初始化完成！');
  console.log(`已导入 ${starsData.length} 颗恒星数据`);
  console.log(`已导入 ${tasksData.length} 个观测任务`);
  console.log(`已导入 ${observationLogsData.length} 条观测记录`);

  db.close();
}

initDatabase().catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
