const express = require('express');
const cors = require('cors');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

let db;
let starKdTree = null;
let allStarsCache = [];

const DEFAULT_TOLERANCE_DEG = 0.5;

class KDNode {
  constructor(point, data, axis) {
    this.point = point;
    this.data = data;
    this.axis = axis;
    this.left = null;
    this.right = null;
  }
}

class KDTree {
  constructor(points, dimensions = 3) {
    this.dimensions = dimensions;
    this.root = this.buildTree(points, 0);
  }

  buildTree(points, depth) {
    if (points.length === 0) return null;

    const axis = depth % this.dimensions;
    points.sort((a, b) => a.point[axis] - b.point[axis]);

    const medianIndex = Math.floor(points.length / 2);
    const node = new KDNode(points[medianIndex].point, points[medianIndex].data, axis);

    node.left = this.buildTree(points.slice(0, medianIndex), depth + 1);
    node.right = this.buildTree(points.slice(medianIndex + 1), depth + 1);

    return node;
  }

  distanceSquared(p1, p2) {
    let dist = 0;
    for (let i = 0; i < this.dimensions; i++) {
      const diff = p1[i] - p2[i];
      dist += diff * diff;
    }
    return dist;
  }

  nearestNeighbor(target, maxDistSq = Infinity) {
    let best = null;
    let bestDist = Infinity;

    function search(node) {
      if (!node) return;

      const distSq = this.distanceSquared(target, node.point);
      if (distSq < bestDist && distSq <= maxDistSq) {
        best = node;
        bestDist = distSq;
      }

      const axis = node.axis;
      const nearSide = target[axis] < node.point[axis] ? node.left : node.right;
      const farSide = target[axis] < node.point[axis] ? node.right : node.left;

      search.call(this, nearSide);

      const planeDist = target[axis] - node.point[axis];
      if (planeDist * planeDist < bestDist) {
        search.call(this, farSide);
      }
    }

    search.call(this, this.root);
    return best ? { node: best, distanceSquared: bestDist } : null;
  }

  rangeSearch(target, radiusSq) {
    const results = [];

    function search(node) {
      if (!node) return;

      const distSq = this.distanceSquared(target, node.point);
      if (distSq <= radiusSq) {
        results.push({ node, distanceSquared: distSq });
      }

      const axis = node.axis;
      const planeDist = target[axis] - node.point[axis];

      if (planeDist * planeDist <= radiusSq) {
        search.call(this, node.left);
        search.call(this, node.right);
      } else if (target[axis] < node.point[axis]) {
        search.call(this, node.left);
      } else {
        search.call(this, node.right);
      }
    }

    search.call(this, this.root);
    return results.sort((a, b) => a.distanceSquared - b.distanceSquared);
  }
}

function sphericalToCartesian(raDeg, decDeg) {
  const ra = degreesToRadians(raDeg);
  const dec = degreesToRadians(decDeg);
  return [
    Math.cos(dec) * Math.cos(ra),
    Math.cos(dec) * Math.sin(ra),
    Math.sin(dec)
  ];
}

function angularDistanceToChordLength(angleDeg) {
  const angle = degreesToRadians(angleDeg);
  return 2 * Math.sin(angle / 2);
}

function chordLengthToAngularDistance(chordLength) {
  return radiansToDegrees(2 * Math.asin(Math.min(1, chordLength / 2)));
}

async function buildStarKdTree() {
  const stars = db.exec('SELECT * FROM stars ORDER BY magnitude ASC');
  if (stars.length === 0) {
    console.log('警告: 没有恒星数据');
    return;
  }

  allStarsCache = stars[0].values.map(row => ({
    id: row[0],
    name: row[1],
    chineseName: row[2],
    ra: row[3],
    dec: row[4],
    magnitude: row[5],
    mansion: row[6],
    enclosure: row[7]
  }));

  const points = allStarsCache.map(star => ({
    point: sphericalToCartesian(star.ra, star.dec),
    data: star
  }));

  starKdTree = new KDTree(points, 3);
  console.log(`KD树构建完成，共索引 ${allStarsCache.length} 颗恒星`);
}

async function initDatabase() {
  const SQL = await initSqlJs({
    locateFile: file => `node_modules/sql.js/dist/${file}`
  });
  
  const dbPath = path.join(__dirname, 'data', 'star_catalog.db');
  const data = fs.readFileSync(dbPath);
  db = new SQL.Database(data);
  console.log('数据库加载成功');
  
  await buildStarKdTree();
}

function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(path.join(__dirname, 'data', 'star_catalog.db'), buffer);
}

function degreesToRadians(deg) {
  return deg * Math.PI / 180;
}

function radiansToDegrees(rad) {
  return rad * 180 / Math.PI;
}

function calculateAltitudeAzimuth(ra, dec, year, location) {
  const locations = {
    '开封': { lat: 34.8, lon: 114.3 },
    '洛阳': { lat: 34.6, lon: 112.4 },
    '长安': { lat: 34.3, lon: 108.9 },
    '大都': { lat: 39.9, lon: 116.4 },
    '登封': { lat: 34.5, lon: 113.0 },
    '默认': { lat: 35.0, lon: 114.0 }
  };
  
  const loc = locations[location] || locations['默认'];
  const lat = degreesToRadians(loc.lat);
  
  const jd = 365.25 * (year - 2000) + 2451545.0;
  const T = (jd - 2451545.0) / 36525.0;
  const gst = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.0003032 * T * T;
  const lst = (gst + loc.lon) % 360;
  
  const ha = degreesToRadians((lst - ra + 360) % 360);
  const decRad = degreesToRadians(dec);
  
  const sinAlt = Math.sin(decRad) * Math.sin(lat) + Math.cos(decRad) * Math.cos(lat) * Math.cos(ha);
  const altitude = Math.max(-90, Math.min(90, radiansToDegrees(Math.asin(sinAlt))));
  
  const cosAlt = Math.cos(degreesToRadians(altitude));
  let azimuth;
  
  if (cosAlt > 0.0001) {
    const cosAz = (Math.sin(decRad) - Math.sin(lat) * sinAlt) / (Math.cos(lat) * cosAlt);
    const sinAz = -Math.cos(decRad) * Math.sin(ha) / cosAlt;
    azimuth = (radiansToDegrees(Math.atan2(sinAz, cosAz)) + 360) % 360;
  } else {
    azimuth = 0;
  }
  
  return { altitude: altitude.toFixed(2), azimuth: azimuth.toFixed(2), location: loc, lst: lst.toFixed(2) };
}

function findNearestStar(ra, dec, toleranceDeg = DEFAULT_TOLERANCE_DEG) {
  if (!starKdTree) {
    console.warn('KD树未初始化，使用线性搜索作为后备');
    return findNearestStarLinear(ra, dec, toleranceDeg);
  }

  const targetPoint = sphericalToCartesian(ra, dec);
  const maxChordLength = angularDistanceToChordLength(toleranceDeg);
  const maxDistSq = maxChordLength * maxChordLength;

  const result = starKdTree.nearestNeighbor(targetPoint, maxDistSq);

  if (!result) return null;

  const angularDistance = chordLengthToAngularDistance(Math.sqrt(result.distanceSquared));

  return {
    ...result.node.data,
    angularDistance: angularDistance.toFixed(2)
  };
}

function findStarsInRange(ra, dec, toleranceDeg = DEFAULT_TOLERANCE_DEG) {
  if (!starKdTree) {
    console.warn('KD树未初始化，返回空结果');
    return [];
  }

  const targetPoint = sphericalToCartesian(ra, dec);
  const maxChordLength = angularDistanceToChordLength(toleranceDeg);
  const maxDistSq = maxChordLength * maxChordLength;

  const results = starKdTree.rangeSearch(targetPoint, maxDistSq);

  return results.map(r => ({
    ...r.node.data,
    angularDistance: chordLengthToAngularDistance(Math.sqrt(r.distanceSquared)).toFixed(2)
  }));
}

function findNearestStarLinear(ra, dec, toleranceDeg = DEFAULT_TOLERANCE_DEG) {
  const stars = db.exec('SELECT * FROM stars');
  if (stars.length === 0) return null;
  
  let nearest = null;
  let minDist = Infinity;
  
  const ra1 = degreesToRadians(ra);
  const dec1 = degreesToRadians(dec);
  
  stars[0].values.forEach(row => {
    const starRa = row[3];
    const starDec = row[4];
    
    const ra2 = degreesToRadians(starRa);
    const dec2 = degreesToRadians(starDec);
    
    const dRa = ra2 - ra1;
    const dDec = dec2 - dec1;
    const a = Math.sin(dDec / 2) ** 2 + Math.cos(dec1) * Math.cos(dec2) * Math.sin(dRa / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(Math.min(a, 1)), Math.sqrt(Math.min(1 - a, 1)));
    const dist = radiansToDegrees(c);
    
    if (dist <= toleranceDeg && dist < minDist) {
      minDist = dist;
      nearest = {
        id: row[0],
        name: row[1],
        chineseName: row[2],
        ra: starRa,
        dec: starDec,
        magnitude: row[5],
        mansion: row[6],
        enclosure: row[7],
        angularDistance: dist.toFixed(2)
      };
    }
  });
  
  return nearest;
}

app.get('/api/stars', (req, res) => {
  try {
    const { enclosure, mansion, magLimit } = req.query;
    let sql = 'SELECT * FROM stars WHERE 1=1';
    const params = [];
    
    if (enclosure) {
      sql += ' AND enclosure = ?';
      params.push(enclosure);
    }
    if (mansion) {
      sql += ' AND mansion = ?';
      params.push(mansion);
    }
    if (magLimit) {
      sql += ' AND magnitude <= ?';
      params.push(parseFloat(magLimit));
    }
    
    sql += ' ORDER BY magnitude ASC';
    
    const result = db.exec(sql, params);
    const stars = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      chineseName: row[2],
      ra: row[3],
      dec: row[4],
      magnitude: row[5],
      mansion: row[6],
      enclosure: row[7]
    })) : [];
    
    res.json({ stars, count: stars.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stars/nearest', (req, res) => {
  try {
    const { ra, dec, tolerance } = req.query;
    if (!ra || !dec) {
      return res.status(400).json({ error: 'RA and Dec are required' });
    }
    
    const toleranceDeg = tolerance !== undefined ? parseFloat(tolerance) : DEFAULT_TOLERANCE_DEG;
    if (isNaN(toleranceDeg) || toleranceDeg < 0 || toleranceDeg > 180) {
      return res.status(400).json({ error: 'Invalid tolerance value (must be 0-180 degrees)' });
    }
    
    const nearest = findNearestStar(parseFloat(ra), parseFloat(dec), toleranceDeg);
    res.json(nearest);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stars/range', (req, res) => {
  try {
    const { ra, dec, tolerance } = req.query;
    if (!ra || !dec) {
      return res.status(400).json({ error: 'RA and Dec are required' });
    }
    
    const toleranceDeg = tolerance !== undefined ? parseFloat(tolerance) : DEFAULT_TOLERANCE_DEG;
    if (isNaN(toleranceDeg) || toleranceDeg < 0 || toleranceDeg > 180) {
      return res.status(400).json({ error: 'Invalid tolerance value (must be 0-180 degrees)' });
    }
    
    const stars = findStarsInRange(parseFloat(ra), parseFloat(dec), toleranceDeg);
    res.json({ stars, count: stars.length, tolerance: toleranceDeg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stats/kdtree', (req, res) => {
  res.json({
    indexed: starKdTree !== null,
    starCount: allStarsCache.length,
    defaultTolerance: DEFAULT_TOLERANCE_DEG,
    indexType: '3D KD-Tree (Cartesian unit sphere)'
  });
});

app.get('/api/stars/:id', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM stars WHERE id = ?', [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ error: 'Star not found' });
    }
    const row = result[0].values[0];
    res.json({
      id: row[0],
      name: row[1],
      chineseName: row[2],
      ra: row[3],
      dec: row[4],
      magnitude: row[5],
      mansion: row[6],
      enclosure: row[7]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calculate/altaz', (req, res) => {
  try {
    const { ra, dec, year = 2024, location = '默认' } = req.body;
    if (!ra || !dec) {
      return res.status(400).json({ error: 'RA and Dec are required' });
    }
    
    const result = calculateAltitudeAzimuth(parseFloat(ra), parseFloat(dec), parseInt(year), location);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/tasks', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM tasks ORDER BY id');
    const tasks = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      description: row[2],
      targetStar: row[3],
      year: row[4],
      location: row[5]
    })) : [];
    
    res.json({ tasks, count: tasks.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/observations', (req, res) => {
  try {
    const { starName, location } = req.query;
    let sql = 'SELECT * FROM observations WHERE 1=1';
    const params = [];
    
    if (starName) {
      sql += ' AND starName = ?';
      params.push(starName);
    }
    if (location) {
      sql += ' AND location = ?';
      params.push(location);
    }
    
    sql += ' ORDER BY time DESC';
    
    const result = db.exec(sql, params);
    const observations = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      time: row[1],
      starName: row[2],
      ra: row[3],
      dec: row[4],
      altitude: row[5],
      azimuth: row[6],
      note: row[7],
      location: row[8]
    })) : [];
    
    res.json({ observations, count: observations.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/observations', (req, res) => {
  try {
    const { time, starName, ra, dec, altitude, azimuth, note, location } = req.body;
    
    if (!time || !starName) {
      return res.status(400).json({ error: 'Time and starName are required' });
    }
    
    const result = db.exec('SELECT MAX(id) as maxId FROM observations');
    const nextId = result[0].values[0][0] ? result[0].values[0][0] + 1 : 1;
    
    db.run(
      'INSERT INTO observations (id, time, starName, ra, dec, altitude, azimuth, note, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nextId, time, starName, ra, dec, altitude, azimuth, note, location]
    );
    
    saveDatabase();
    res.json({ id: nextId, message: '观测记录已保存' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/observations/:id', (req, res) => {
  try {
    db.run('DELETE FROM observations WHERE id = ?', [req.params.id]);
    saveDatabase();
    res.json({ message: '观测记录已删除' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/observations/export/csv', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM observations ORDER BY time');
    
    if (result.length === 0) {
      return res.status(404).json({ error: 'No observations found' });
    }
    
    const headers = ['ID', '时间', '星体名称', '赤经(°)', '赤纬(°)', '地平高度(°)', '方位角(°)', '备注', '地点'];
    const rows = result[0].values.map(row => row.map(cell => `"${cell || ''}"`).join(','));
    
    const csv = [headers.join(','), ...rows].join('\n');
    
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="observations.csv"');
    res.send('\ufeff' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/enclosures', (req, res) => {
  try {
    const result = db.exec('SELECT DISTINCT enclosure FROM stars WHERE enclosure IS NOT NULL');
    const enclosures = result.length > 0 ? result[0].values.map(row => row[0]) : [];
    res.json({ enclosures });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/mansions', (req, res) => {
  try {
    const { enclosure } = req.query;
    let sql = 'SELECT DISTINCT mansion FROM stars WHERE mansion IS NOT NULL';
    const params = [];
    
    if (enclosure) {
      sql += ' AND enclosure = ?';
      params.push(enclosure);
    }
    
    const result = db.exec(sql, params);
    const mansions = result.length > 0 ? result[0].values.map(row => row[0]) : [];
    res.json({ mansions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/bright-stars', (req, res) => {
  try {
    const result = db.exec('SELECT * FROM stars WHERE magnitude <= 1.5 ORDER BY magnitude ASC');
    const stars = result.length > 0 ? result[0].values.map(row => ({
      id: row[0],
      name: row[1],
      chineseName: row[2],
      ra: row[3],
      dec: row[4],
      magnitude: row[5],
      mansion: row[6],
      enclosure: row[7]
    })) : [];
    
    res.json({ stars, count: stars.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`浑仪三维模拟服务器运行在 http://localhost:${PORT}`);
    console.log('API文档:');
    console.log('  GET  /api/stars              - 获取恒星列表');
    console.log('  GET  /api/stars/nearest      - 查找最近恒星 (KD树空间索引)');
    console.log('  GET  /api/stars/range        - 范围搜索恒星 (容差可配置)');
    console.log('  GET  /api/stars/:id          - 获取单颗恒星');
    console.log('  GET  /api/stats/kdtree       - KD树索引状态');
    console.log('  POST /api/calculate/altaz    - 计算地平高度方位角');
    console.log('  GET  /api/tasks              - 获取观测任务');
    console.log('  GET  /api/observations       - 获取观测记录');
    console.log('  POST /api/observations       - 添加观测记录');
    console.log('  GET  /api/observations/export/csv - 导出CSV');
    console.log('  GET  /api/bright-stars       - 获取亮星列表');
  });
}).catch(err => {
  console.error('服务器启动失败:', err);
  process.exit(1);
});
