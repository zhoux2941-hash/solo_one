const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');
const XLSX = require('xlsx');

const app = express();
const PORT = 3000;

const dbPath = path.join(__dirname, 'db', 'instruments.db');
const db = new Database(dbPath, { readonly: true });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/instruments', (req, res) => {
  const { dynasty, type, keyword } = req.query;
  let sql = 'SELECT * FROM instruments WHERE 1=1';
  const params = [];

  if (dynasty && dynasty !== '全部') {
    sql += ' AND dynasty = ?';
    params.push(dynasty);
  }
  if (type && type !== '全部') {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (keyword) {
    sql += ' AND (name LIKE ? OR decoration LIKE ? OR description LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  sql += ' ORDER BY id';
  const instruments = db.prepare(sql).all(...params);
  res.json(instruments);
});

app.get('/api/instruments/:id', (req, res) => {
  const inst = db.prepare('SELECT * FROM instruments WHERE id = ?').get(req.params.id);
  if (!inst) return res.status(404).json({ error: 'Not found' });

  const dimensions = db.prepare('SELECT * FROM dimensions WHERE instrument_id = ?').all(req.params.id);
  res.json({ ...inst, dimensions });
});

app.get('/api/filters', (req, res) => {
  const dynasties = db.prepare('SELECT DISTINCT dynasty FROM instruments ORDER BY dynasty').all().map(r => r.dynasty);
  const types = db.prepare('SELECT DISTINCT type FROM instruments ORDER BY type').all().map(r => r.type);
  res.json({ dynasties, types });
});

app.get('/api/export', (req, res) => {
  const { dynasty, type } = req.query;
  let sql = `SELECT i.*, d.label as dim_label, d.value_cm as dim_value, d.direction as dim_direction
             FROM instruments i LEFT JOIN dimensions d ON i.id = d.instrument_id WHERE 1=1`;
  const params = [];

  if (dynasty && dynasty !== '全部') {
    sql += ' AND i.dynasty = ?';
    params.push(dynasty);
  }
  if (type && type !== '全部') {
    sql += ' AND i.type = ?';
    params.push(type);
  }

  sql += ' ORDER BY i.id, d.id';
  const rows = db.prepare(sql).all(...params);

  const instrumentMap = new Map();
  for (const row of rows) {
    if (!instrumentMap.has(row.id)) {
      instrumentMap.set(row.id, {
        '名称': row.name,
        '器类': row.type,
        '朝代': row.dynasty,
        '出土地': row.excavation_site,
        '通高(cm)': row.height_cm,
        '通宽(cm)': row.width_cm,
        '通深(cm)': row.depth_cm,
        '重量(kg)': row.weight_kg,
        '材质': row.material,
        '纹饰描述': row.decoration,
        '详细说明': row.description,
        '尺寸标注': []
      });
    }
    if (row.dim_label) {
      instrumentMap.get(row.id)['尺寸标注'].push(`${row.dim_label}: ${row.dim_value}cm`);
    }
  }

  const exportData = Array.from(instrumentMap.values()).map(item => ({
    ...item,
    '尺寸标注': item['尺寸标注'].join('；')
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 18 }, { wch: 8 }, { wch: 8 }, { wch: 18 },
    { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
    { wch: 10 }, { wch: 40 }, { wch: 40 }, { wch: 40 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, '礼乐器形制数据');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=instruments.xlsx');
  res.send(buf);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
