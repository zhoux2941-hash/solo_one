const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const getExamItems = db.prepare('SELECT * FROM exam_items ORDER BY id');
const getTemplates = db.prepare('SELECT * FROM templates ORDER BY pet_type, name');
const getTemplateById = db.prepare('SELECT * FROM templates WHERE id = ?');
const getRecordById = db.prepare('SELECT * FROM medical_records WHERE id = ?');
const getRecordExams = db.prepare('SELECT * FROM record_exams WHERE record_id = ? ORDER BY id');
const getRecordMedicines = db.prepare('SELECT * FROM record_medicines WHERE record_id = ? ORDER BY id');

const getRecordsByCursor = db.prepare(`
  SELECT * FROM medical_records 
  WHERE id < ?
  ORDER BY id DESC 
  LIMIT ?
`);
const getRecordsFirstPage = db.prepare(`
  SELECT * FROM medical_records 
  ORDER BY id DESC 
  LIMIT ?
`);
const searchRecordsByCursor = db.prepare(`
  SELECT * FROM medical_records 
  WHERE (pet_name LIKE ? OR owner_name LIKE ?) AND id < ?
  ORDER BY id DESC 
  LIMIT ?
`);
const searchRecordsFirstPage = db.prepare(`
  SELECT * FROM medical_records 
  WHERE pet_name LIKE ? OR owner_name LIKE ?
  ORDER BY id DESC 
  LIMIT ?
`);
const getRecordsCount = db.prepare('SELECT COUNT(*) as cnt FROM medical_records');
const searchRecordsCount = db.prepare(`
  SELECT COUNT(*) as cnt FROM medical_records 
  WHERE pet_name LIKE ? OR owner_name LIKE ?
`);

const insertRecord = db.prepare(`
  INSERT INTO medical_records (
    pet_name, owner_name, owner_phone, pet_type, breed, age, gender,
    weight, temperature, chief_complaint, clinical_findings, diagnosis,
    prescription, treatment_plan, doctor_name, total_fee
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const updateRecord = db.prepare(`
  UPDATE medical_records SET
    pet_name = ?, owner_name = ?, owner_phone = ?, pet_type = ?, breed = ?,
    age = ?, gender = ?, weight = ?, temperature = ?, chief_complaint = ?,
    clinical_findings = ?, diagnosis = ?, prescription = ?, treatment_plan = ?,
    doctor_name = ?, total_fee = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const deleteRecordExams = db.prepare('DELETE FROM record_exams WHERE record_id = ?');
const insertRecordExam = db.prepare(`
  INSERT INTO record_exams (record_id, exam_item_id, exam_name, exam_price, result)
  VALUES (?, ?, ?, ?, ?)
`);
const deleteRecord = db.prepare('DELETE FROM medical_records WHERE id = ?');

const getMedicines = db.prepare('SELECT * FROM medicines ORDER BY category, name');
const getMedicineById = db.prepare('SELECT * FROM medicines WHERE id = ?');
const getMedicineByIdForUpdate = db.prepare('SELECT * FROM medicines WHERE id = ?');
const deleteRecordMedicines = db.prepare('DELETE FROM record_medicines WHERE record_id = ?');
const insertRecordMedicine = db.prepare(`
  INSERT INTO record_medicines (record_id, medicine_id, medicine_name, specification, unit, unit_price, quantity, usage)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const updateMedicineStock = db.prepare(`
  UPDATE medicines SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
`);
const checkMedicineStock = db.prepare('SELECT id, name, stock FROM medicines WHERE id = ?');
const updateMedicine = db.prepare(`
  UPDATE medicines SET name = ?, specification = ?, unit = ?, price = ?, stock = ?, min_stock = ?, 
  category = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
`);
const insertMedicine = db.prepare(`
  INSERT INTO medicines (name, specification, unit, price, stock, min_stock, category, description)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);
const deleteMedicine = db.prepare('DELETE FROM medicines WHERE id = ?');

function calculateTotalFee(examItems, medicines) {
  let total = 0;
  for (const item of (examItems || [])) {
    total += (item.exam_price || 0);
  }
  for (const med of (medicines || [])) {
    total += (med.unit_price || 0) * (med.quantity || 0);
  }
  return total;
}

app.get('/api/exam-items', (req, res) => {
  const items = getExamItems.all();
  res.json({ success: true, data: items });
});

app.get('/api/templates', (req, res) => {
  const templates = getTemplates.all().map(t => ({
    ...t,
    exam_checklist: t.exam_checklist ? JSON.parse(t.exam_checklist) : []
  }));
  res.json({ success: true, data: templates });
});

app.get('/api/templates/:id', (req, res) => {
  const template = getTemplateById.get(req.params.id);
  if (!template) {
    return res.json({ success: false, message: '模板不存在' });
  }
  template.exam_checklist = template.exam_checklist ? JSON.parse(template.exam_checklist) : [];
  res.json({ success: true, data: template });
});

app.get('/api/medicines', (req, res) => {
  const medicines = getMedicines.all();
  res.json({ success: true, data: medicines });
});

app.get('/api/medicines/:id', (req, res) => {
  const medicine = getMedicineById.get(req.params.id);
  if (!medicine) {
    return res.json({ success: false, message: '药品不存在' });
  }
  res.json({ success: true, data: medicine });
});

app.post('/api/medicines', (req, res) => {
  const body = req.body;
  try {
    const info = insertMedicine.run(
      body.name, body.specification || '', body.unit || '盒',
      body.price || 0, body.stock || 0, body.min_stock || 10,
      body.category || '', body.description || ''
    );
    res.json({ success: true, data: { id: info.lastInsertRowid } });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.put('/api/medicines/:id', (req, res) => {
  const body = req.body;
  try {
    updateMedicine.run(
      body.name, body.specification || '', body.unit || '盒',
      body.price || 0, body.stock || 0, body.min_stock || 10,
      body.category || '', body.description || '', req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/medicines/:id', (req, res) => {
  try {
    deleteMedicine.run(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: err.message });
  }
});

app.post('/api/medicines/stock-check', (req, res) => {
  const medicines = req.body.medicines || [];
  const insufficient = [];
  for (const med of medicines) {
    const current = checkMedicineStock.get(med.medicine_id);
    if (!current) {
      insufficient.push({ ...med, reason: '药品不存在' });
    } else if (current.stock < (med.quantity || 0)) {
      insufficient.push({ ...med, current_stock: current.stock, reason: '库存不足' });
    }
  }
  res.json({ success: true, sufficient: insufficient.length === 0, insufficient });
});

app.get('/api/records', (req, res) => {
  const start = Date.now();
  const cursor = parseInt(req.query.cursor);
  const pageSize = parseInt(req.query.pageSize) || 20;
  const keyword = req.query.keyword || '';

  let records, total, hasMore;
  
  if (keyword) {
    const search = `%${keyword}%`;
    total = searchRecordsCount.get(search, search).cnt;
    
    if (cursor) {
      records = searchRecordsByCursor.all(search, search, cursor, pageSize + 1);
    } else {
      records = searchRecordsFirstPage.all(search, search, pageSize + 1);
    }
  } else {
    total = getRecordsCount.get().cnt;
    
    if (cursor) {
      records = getRecordsByCursor.all(cursor, pageSize + 1);
    } else {
      records = getRecordsFirstPage.all(pageSize + 1);
    }
  }

  hasMore = records.length > pageSize;
  if (hasMore) records.pop();
  
  const nextCursor = records.length > 0 ? records[records.length - 1].id : null;
  const duration = Date.now() - start;
  
  res.json({
    success: true,
    data: records,
    total,
    pageSize,
    hasMore,
    nextCursor,
    queryTime: `${duration}ms`
  });
});

app.get('/api/records/:id', (req, res) => {
  const start = Date.now();
  const record = getRecordById.get(req.params.id);
  if (!record) {
    return res.json({ success: false, message: '病历不存在' });
  }
  const exams = getRecordExams.all(req.params.id);
  record.exams = exams;
  const medicines = getRecordMedicines.all(req.params.id);
  record.medicines = medicines;
  const duration = Date.now() - start;
  res.json({ success: true, data: record, queryTime: `${duration}ms` });
});

app.post('/api/records', (req, res) => {
  const tx = db.transaction(() => {
    const body = req.body;
    const exams = body.exams || [];
    const medicines = body.medicines || [];

    for (const med of medicines) {
      const current = getMedicineByIdForUpdate.get(med.medicine_id);
      if (!current) {
        throw new Error(`药品ID ${med.medicine_id} 不存在`);
      }
      if (current.stock < (med.quantity || 0)) {
        throw new Error(`【${current.name}】库存不足：当前库存 ${current.stock}，需要 ${med.quantity}`);
      }
    }

    const totalFee = calculateTotalFee(exams, medicines);

    const info = insertRecord.run(
      body.pet_name, body.owner_name, body.owner_phone || '', body.pet_type || '',
      body.breed || '', body.age || '', body.gender || '',
      body.weight || null, body.temperature || null,
      body.chief_complaint || '', body.clinical_findings || '', body.diagnosis || '',
      body.prescription || '', body.treatment_plan || '', body.doctor_name || '',
      totalFee
    );

    const recordId = info.lastInsertRowid;
    for (const exam of exams) {
      insertRecordExam.run(
        recordId, exam.exam_item_id, exam.exam_name, exam.exam_price, exam.result || ''
      );
    }

    for (const med of medicines) {
      insertRecordMedicine.run(
        recordId, med.medicine_id, med.medicine_name, med.specification || '',
        med.unit || '盒', med.unit_price || 0, med.quantity || 0, med.usage || ''
      );
      updateMedicineStock.run(-(med.quantity || 0), med.medicine_id);
    }

    return recordId;
  });

  try {
    const recordId = tx();
    res.json({ success: true, data: { id: recordId } });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

app.put('/api/records/:id', (req, res) => {
  const tx = db.transaction(() => {
    const body = req.body;
    const recordId = req.params.id;
    const exams = body.exams || [];
    const medicines = body.medicines || [];

    const oldMedicines = getRecordMedicines.all(recordId);
    for (const oldMed of oldMedicines) {
      updateMedicineStock.run(oldMed.quantity, oldMed.medicine_id);
    }

    for (const med of medicines) {
      const current = getMedicineByIdForUpdate.get(med.medicine_id);
      if (!current) {
        throw new Error(`药品ID ${med.medicine_id} 不存在`);
      }
      if (current.stock < (med.quantity || 0)) {
        throw new Error(`【${current.name}】库存不足：当前库存 ${current.stock}，需要 ${med.quantity}`);
      }
    }

    const totalFee = calculateTotalFee(exams, medicines);

    updateRecord.run(
      body.pet_name, body.owner_name, body.owner_phone || '', body.pet_type || '',
      body.breed || '', body.age || '', body.gender || '',
      body.weight || null, body.temperature || null,
      body.chief_complaint || '', body.clinical_findings || '', body.diagnosis || '',
      body.prescription || '', body.treatment_plan || '', body.doctor_name || '',
      totalFee, recordId
    );

    deleteRecordExams.run(recordId);
    for (const exam of exams) {
      insertRecordExam.run(
        recordId, exam.exam_item_id, exam.exam_name, exam.exam_price, exam.result || ''
      );
    }

    deleteRecordMedicines.run(recordId);
    for (const med of medicines) {
      insertRecordMedicine.run(
        recordId, med.medicine_id, med.medicine_name, med.specification || '',
        med.unit || '盒', med.unit_price || 0, med.quantity || 0, med.usage || ''
      );
      updateMedicineStock.run(-(med.quantity || 0), med.medicine_id);
    }

    return recordId;
  });

  try {
    const recordId = tx();
    res.json({ success: true, data: { id: recordId } });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

app.delete('/api/records/:id', (req, res) => {
  const tx = db.transaction(() => {
    const medicines = getRecordMedicines.all(req.params.id);
    for (const med of medicines) {
      updateMedicineStock.run(med.quantity, med.medicine_id);
    }
    deleteRecordMedicines.run(req.params.id);
    deleteRecordExams.run(req.params.id);
    deleteRecord.run(req.params.id);
  });
  try {
    tx();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: err.message });
  }
});

app.get('/api/performance-test', (req, res) => {
  const count = getRecordsCount.get().cnt;
  
  const start = Date.now();
  const records = getRecordsFirstPage.all(10000);
  const duration = Date.now() - start;
  
  const startDeep = Date.now();
  const midId = Math.floor(count / 2);
  const deepRecords = getRecordsByCursor.all(midId, 20);
  const deepDuration = Date.now() - startDeep;

  res.json({
    success: true,
    totalRecords: count,
    queryAllTime: `${duration}ms`,
    avgPerRecord: `${(duration / records.length).toFixed(4)}ms`,
    deepPaginationTime: `${deepDuration}ms`,
    deepPaginationCount: deepRecords.length,
    meetsRequirement: duration < 1000
  });
});

app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/') && !req.path.includes('.') && req.path !== '/') {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`宠物医院电子病历系统已启动: http://localhost:${PORT}`);
});
