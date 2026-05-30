const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 8080;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const dataPath = path.join(__dirname, '../database/stars_data.json');
let starData;

try {
  starData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
} catch (err) {
  console.error('Error loading star data:', err);
  starData = { stars: [], constellations: [] };
}

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;
const ARCSEC2DEG = 1 / 3600;

function precessionAnglesP03(t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const t4 = t3 * t;
  const t5 = t4 * t;

  const zetaA = (2.650545
    + 2306.083227 * t
    + 1.092734 * t2
    + 0.018398 * t3
    + 0.000008 * t4
    - 0.0000002 * t5) * ARCSEC2DEG;

  const zA = (-2.650545
    + 2306.077181 * t
    + 1.092568 * t2
    + 0.018367 * t3
    + 0.000008 * t4
    - 0.0000002 * t5) * ARCSEC2DEG;

  const thetaA = (2004.191903 * t
    - 0.429493 * t2
    - 0.041822 * t3
    - 0.000007 * t4
    + 0.0000003 * t5) * ARCSEC2DEG;

  return { zetaA, zA, thetaA };
}

function buildPrecessionMatrix(t) {
  const { zetaA, zA, thetaA } = precessionAnglesP03(t);

  const zeta = zetaA * DEG2RAD;
  const z = zA * DEG2RAD;
  const theta = thetaA * DEG2RAD;

  const cz = Math.cos(z);
  const sz = Math.sin(z);
  const cze = Math.cos(zeta);
  const sze = Math.sin(zeta);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);

  return [
    [cze * ct * cz - sze * sz, -cze * ct * sz - sze * cz, -cze * st],
    [sze * ct * cz + cze * sz, -sze * ct * sz + cze * cz, -sze * st],
    [st * cz, -st * sz, ct]
  ];
}

function matVecMul(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
  ];
}

function matTransposeVecMul(m, v) {
  return [
    m[0][0] * v[0] + m[1][0] * v[1] + m[2][0] * v[2],
    m[0][1] * v[0] + m[1][1] * v[1] + m[2][1] * v[2],
    m[0][2] * v[0] + m[1][2] * v[1] + m[2][2] * v[2]
  ];
}

function applyPrecession(star, targetYear) {
  const raRad = star.ra * DEG2RAD;
  const decRad = star.dec * DEG2RAD;

  const x = Math.cos(decRad) * Math.cos(raRad);
  const y = Math.cos(decRad) * Math.sin(raRad);
  const z = Math.sin(decRad);

  const sourceT = (star.epoch_year - 2000.0) / 100.0;
  const targetT = (targetYear - 2000.0) / 100.0;

  let r;
  if (Math.abs(sourceT) < 1e-10) {
    r = matVecMul(buildPrecessionMatrix(targetT), [x, y, z]);
  } else {
    const pSource = buildPrecessionMatrix(sourceT);
    const pTarget = buildPrecessionMatrix(targetT);
    const rJ2000 = matTransposeVecMul(pSource, [x, y, z]);
    r = matVecMul(pTarget, rJ2000);
  }

  let newRa = Math.atan2(r[1], r[0]) * RAD2DEG;
  if (newRa < 0) newRa += 360;
  if (newRa >= 360) newRa -= 360;
  const newDec = Math.asin(Math.max(-1, Math.min(1, r[2]))) * RAD2DEG;

  return {
    ...star,
    ra: newRa,
    dec: newDec
  };
}

app.get('/api/stars', (req, res) => {
  const year = parseInt(req.query.year) || 2024;
  const adjustedStars = starData.stars.map(star => applyPrecession(star, year));
  res.json(adjustedStars);
});

app.get('/api/stars/modern', (req, res) => {
  res.json(starData.stars);
});

app.get('/api/stars/background', (req, res) => {
  const count = parseInt(req.query.count) || 3000;
  const seed = parseInt(req.query.seed) || 42;
  const stars = [];
  let s = seed;
  const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  for (let i = 0; i < count; i++) {
    const ra = rand() * 360;
    const dec = Math.asin(2 * rand() - 1) * 180 / Math.PI;
    const magnitude = 4.5 + rand() * 3.5;
    stars.push({ id: 10000 + i, ra, dec, magnitude });
  }
  res.json(stars);
});

app.get('/api/constellations', (req, res) => {
  res.json(starData.constellations);
});

app.get('/api/stars/search', (req, res) => {
  const query = req.query.q || '';
  const year = parseInt(req.query.year) || 2024;
  
  const results = starData.stars
    .filter(star => 
      star.name_chinese.includes(query) ||
      star.name_greek.toLowerCase().includes(query.toLowerCase()) ||
      star.name_bayer.toLowerCase().includes(query.toLowerCase()) ||
      star.constellation.includes(query)
    )
    .map(star => applyPrecession(star, year));
  
  res.json(results);
});

const CSV_MAX_BATCH = 50;
const CSV_HEADERS = ['id', 'name_chinese', 'name_greek', 'name_bayer', 'constellation', 'ra', 'dec', 'magnitude', 'epoch_year'];

function starsToCsvRows(stars) {
  return stars.map(star =>
    CSV_HEADERS.map(h => {
      const value = star[h];
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value;
    }).join(',')
  );
}

app.get('/api/stars/csv/meta', (req, res) => {
  const year = parseInt(req.query.year) || 2024;
  const total = starData.stars.length;
  const batchSize = CSV_MAX_BATCH;
  const totalBatches = Math.ceil(total / batchSize);

  res.json({
    total,
    batchSize,
    totalBatches,
    year,
    headers: CSV_HEADERS
  });
});

app.get('/api/stars/csv', (req, res) => {
  const year = parseInt(req.query.year) || 2024;
  const offset = Math.max(0, parseInt(req.query.offset) || 0);
  const requestedLimit = parseInt(req.query.limit);
  const limit = requestedLimit
    ? Math.min(Math.max(1, requestedLimit), CSV_MAX_BATCH)
    : CSV_MAX_BATCH;
  const includeHeader = req.query.header !== '0';

  const adjustedStars = starData.stars
    .map(star => applyPrecession(star, year))
    .slice(offset, offset + limit);

  const rows = starsToCsvRows(adjustedStars);
  const parts = [];
  if (includeHeader) {
    parts.push(CSV_HEADERS.join(','));
  }
  parts.push(...rows);

  const batchIndex = Math.floor(offset / CSV_MAX_BATCH) + 1;
  const totalBatches = Math.ceil(starData.stars.length / CSV_MAX_BATCH);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="star_catalog_${year}_batch${batchIndex}of${totalBatches}.csv"`);
  res.send('\uFEFF' + parts.join('\n'));
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', starsCount: starData.stars.length, constellationsCount: starData.constellations.length });
});

app.listen(PORT, () => {
  console.log(`古代星表可视化工具后端服务运行在 http://localhost:${PORT}`);
  console.log(`加载了 ${starData.stars.length} 颗恒星，${starData.constellations.length} 个星座`);
});
