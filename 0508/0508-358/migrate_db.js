const db = require('./database/db');

console.log('开始数据库迁移...');

try {
  const pragma = db.pragma('table_info(record_exams)');
  const priceCol = pragma.find(col => col.name === 'exam_price');

  console.log('当前 exam_price 列:', priceCol);

  if (priceCol && !priceCol.dflt_value) {
    console.log('发现 exam_price 缺少 DEFAULT 0，开始重建表...');

    db.exec(`
      CREATE TABLE IF NOT EXISTS record_exams_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER NOT NULL,
        exam_item_id INTEGER NOT NULL,
        exam_name TEXT NOT NULL,
        exam_price REAL NOT NULL DEFAULT 0,
        result TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
        FOREIGN KEY (exam_item_id) REFERENCES exam_items(id)
      );

      INSERT INTO record_exams_new (id, record_id, exam_item_id, exam_name, exam_price, result, created_at)
      SELECT id, record_id, exam_item_id, exam_name, COALESCE(exam_price, 0), result, created_at
      FROM record_exams;

      DROP TABLE IF EXISTS record_exams;
      ALTER TABLE record_exams_new RENAME TO record_exams;
    `);

    const count = db.prepare('SELECT COUNT(*) as cnt FROM record_exams').get().cnt;
    console.log(`✅ 迁移完成，共迁移 ${count} 条记录`);
    console.log('✅ exam_price 字段已设置 DEFAULT 0');
  } else {
    console.log('✅ exam_price 字段已有 DEFAULT 0，无需迁移');
  }

  const nullCount = db.prepare('SELECT COUNT(*) as cnt FROM record_exams WHERE exam_price IS NULL').get().cnt;
  if (nullCount > 0) {
    console.log(`发现 ${nullCount} 条 exam_price 为 NULL 的记录，正在修复...`);
    db.prepare('UPDATE record_exams SET exam_price = 0 WHERE exam_price IS NULL').run();
    console.log('✅ NULL 值已修复为 0');
  }

  const nullTotalFee = db.prepare('SELECT COUNT(*) as cnt FROM medical_records WHERE total_fee IS NULL').get().cnt;
  if (nullTotalFee > 0) {
    console.log(`发现 ${nullTotalFee} 条 total_fee 为 NULL 的记录，正在修复...`);
    db.prepare('UPDATE medical_records SET total_fee = 0 WHERE total_fee IS NULL').run();
    console.log('✅ total_fee NULL 值已修复为 0');
  }

  console.log('\n✅ 数据库迁移完成');

} catch (err) {
  console.error('❌ 迁移失败:', err.message);
} finally {
  db.close();
}
