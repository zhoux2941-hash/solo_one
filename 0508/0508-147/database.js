const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');

let db;

function initDatabase() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'paint-helper.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS paint_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      default_clean_interval INTEGER DEFAULT 60
    );

    CREATE TABLE IF NOT EXISTS paints (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      brand_id INTEGER NOT NULL,
      type_id INTEGER NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      default_ratio_paint INTEGER NOT NULL DEFAULT 1,
      default_ratio_thinner INTEGER NOT NULL DEFAULT 1,
      recommended_pressure REAL,
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (type_id) REFERENCES paint_types(id),
      UNIQUE(brand_id, type_id, code)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paint_id INTEGER NOT NULL,
      custom_ratio_paint INTEGER NOT NULL,
      custom_ratio_thinner INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paint_id) REFERENCES paints(id),
      UNIQUE(paint_id)
    );

    CREATE TABLE IF NOT EXISTS mixing_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total_ml REAL NOT NULL,
      total_paint_ml REAL NOT NULL,
      total_thinner_ml REAL NOT NULL,
      combined_ratio_paint INTEGER NOT NULL,
      combined_ratio_thinner INTEGER NOT NULL,
      recommended_pressure REAL,
      is_mixed INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS mixing_record_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_id INTEGER NOT NULL,
      paint_id INTEGER NOT NULL,
      paint_ml REAL NOT NULL,
      thinner_ml REAL NOT NULL,
      mix_ratio_paint INTEGER NOT NULL,
      mix_ratio_thinner INTEGER NOT NULL,
      mix_proportion INTEGER NOT NULL,
      FOREIGN KEY (record_id) REFERENCES mixing_records(id),
      FOREIGN KEY (paint_id) REFERENCES paints(id)
    );

    CREATE TABLE IF NOT EXISTS spray_gun_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paint_type_id INTEGER NOT NULL,
      clean_interval_minutes INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paint_type_id) REFERENCES paint_types(id),
      UNIQUE(paint_type_id)
    );

    CREATE TABLE IF NOT EXISTS spray_gun_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paint_type_id INTEGER NOT NULL,
      usage_minutes INTEGER NOT NULL DEFAULT 0,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      is_cleaned INTEGER DEFAULT 0,
      cleaned_at DATETIME,
      FOREIGN KEY (paint_type_id) REFERENCES paint_types(id)
    );
  `);

  const tableInfo = db.prepare("PRAGMA table_info(mixing_history)").all();
  if (tableInfo.length > 0) {
    try {
      db.exec(`
        INSERT INTO mixing_records (total_ml, total_paint_ml, total_thinner_ml, combined_ratio_paint, combined_ratio_thinner, recommended_pressure, is_mixed, created_at)
        SELECT total_ml, paint_ml, thinner_ml, ratio_paint, ratio_thinner, pressure, 0, created_at FROM mixing_history;
      `);
      
      const oldRecords = db.prepare('SELECT id, paint_id, total_ml, paint_ml, thinner_ml, ratio_paint, ratio_thinner FROM mixing_history').all();
      const insertItem = db.prepare(`
        INSERT INTO mixing_record_items (record_id, paint_id, paint_ml, thinner_ml, mix_ratio_paint, mix_ratio_thinner, mix_proportion)
        VALUES (?, ?, ?, ?, ?, ?, 1)
      `);
      
      oldRecords.forEach(rec => {
        insertItem.run(rec.id, rec.paint_id, rec.paint_ml, rec.thinner_ml, rec.ratio_paint, rec.ratio_thinner);
      });
      
      db.exec('DROP TABLE mixing_history');
    } catch (e) {
      console.log('Migration skipped or failed:', e.message);
    }
  }

  const brandCount = db.prepare('SELECT COUNT(*) as count FROM brands').get().count;
  if (brandCount === 0) {
    seedData();
  }

  initSprayGunSettings();

  return db;
}

function seedData() {
  const insertBrand = db.prepare('INSERT INTO brands (name, description) VALUES (?, ?)');
  const insertType = db.prepare('INSERT INTO paint_types (name, description, default_clean_interval) VALUES (?, ?, ?)');
  const insertPaint = db.prepare(`
    INSERT INTO paints (brand_id, type_id, code, name, default_ratio_paint, default_ratio_thinner, recommended_pressure)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const tamiya = insertBrand.run('田宫 Tamiya', '日本著名模型品牌');
  const mrhobby = insertBrand.run('郡士 Mr.Hobby', '日本专业模型油漆品牌');
  const ak = insertBrand.run('AK Interactive', '西班牙专业模型油漆品牌');
  const vallejo = insertBrand.run('Vallejo', '西班牙水性漆品牌');

  const waterBased = insertType.run('水性漆', 'Water-based paint', 60);
  const oilBased = insertType.run('油性漆', 'Oil-based paint', 20);
  const lacquer = insertType.run('硝基漆', 'Lacquer paint', 30);
  const enamel = insertType.run('珐琅漆', 'Enamel paint', 20);

  const tamiyaWaterPaints = [
    ['XF-1', '哑光黑', 1, 2, 15],
    ['XF-2', '哑光白', 1, 2, 15],
    ['XF-3', '哑光黄', 1, 2, 15],
    ['XF-4', '哑光黄叶绿', 1, 2, 15],
    ['XF-5', '哑光绿', 1, 2, 15],
    ['XF-6', '哑光铜绿', 1, 2, 15],
    ['XF-7', '哑光红', 1, 2, 15],
    ['XF-8', '哑光蓝', 1, 2, 15],
    ['X-1', '光泽黑', 1, 2, 15],
    ['X-2', '光泽白', 1, 2, 15],
    ['X-3', '光泽皇家蓝', 1, 2, 15],
    ['X-4', '光泽蓝', 1, 2, 15],
    ['X-5', '光泽绿', 1, 2, 15],
    ['X-6', '光泽橙', 1, 2, 15],
    ['X-7', '光泽红', 1, 2, 15],
  ];

  const tamiyaLacquerPaints = [
    ['TS-1', '光泽红', 1, 1, 20],
    ['TS-2', '光泽蓝', 1, 1, 20],
    ['TS-3', '光泽黄', 1, 1, 20],
    ['TS-4', '光泽白', 1, 1, 20],
    ['TS-5', '光泽黑', 1, 1, 20],
    ['TS-6', '哑光黑', 1, 1, 20],
    ['TS-7', '赛车白', 1, 1, 20],
    ['TS-8', '意大利红', 1, 1, 20],
  ];

  const mrHobbyLacquerPaints = [
    ['Mr.Color 1', '光泽黑', 1, 1, 20],
    ['Mr.Color 2', '光泽白', 1, 1, 20],
    ['Mr.Color 3', '光泽红', 1, 1, 20],
    ['Mr.Color 4', '光泽黄', 1, 1, 20],
    ['Mr.Color 5', '光泽蓝', 1, 1, 20],
    ['Mr.Color 6', '光泽绿', 1, 1, 20],
    ['Mr.Color 7', '光泽橙', 1, 1, 20],
    ['Mr.Color 8', '光泽棕', 1, 1, 20],
    ['Mr.Color 1000', '灰色补土 1000', 1, 1, 18],
    ['Mr.Color 1200', '灰色补土 1200', 1, 1, 18],
    ['Mr.Color 1500', '灰色补土 1500', 1, 1, 18],
  ];

  const akInteractivePaints = [
    ['AK 11001', '德国灰', 1, 2, 15],
    ['AK 11002', '沙漠黄', 1, 2, 15],
    ['AK 11003', '橄榄绿', 1, 2, 15],
    ['AK 11004', '红棕色', 1, 2, 15],
    ['AK 11005', '黑色', 1, 2, 15],
    ['AK 11006', '白色', 1, 2, 15],
    ['AK 11007', '黄色', 1, 2, 15],
    ['AK 11008', '红色', 1, 2, 15],
    ['AK 11009', '蓝色', 1, 2, 15],
    ['AK 11010', '绿色', 1, 2, 15],
  ];

  const vallejoPaints = [
    ['Vallejo 70.950', '哑光黑', 1, 1, 12],
    ['Vallejo 70.951', '哑光白', 1, 1, 12],
    ['Vallejo 70.853', '哑光红', 1, 1, 12],
    ['Vallejo 70.858', '哑光黄', 1, 1, 12],
    ['Vallejo 70.899', '哑光蓝', 1, 1, 12],
    ['Vallejo 70.888', '哑光绿', 1, 1, 12],
    ['Vallejo 70.947', '哑光棕', 1, 1, 12],
    ['Vallejo 70.811', '哑光橙', 1, 1, 12],
  ];

  tamiyaWaterPaints.forEach(p => 
    insertPaint.run(tamiya.lastInsertRowid, waterBased.lastInsertRowid, p[0], p[1], p[2], p[3], p[4])
  );

  tamiyaLacquerPaints.forEach(p => 
    insertPaint.run(tamiya.lastInsertRowid, lacquer.lastInsertRowid, p[0], p[1], p[2], p[3], p[4])
  );

  mrHobbyLacquerPaints.forEach(p => 
    insertPaint.run(mrhobby.lastInsertRowid, lacquer.lastInsertRowid, p[0], p[1], p[2], p[3], p[4])
  );

  akInteractivePaints.forEach(p => 
    insertPaint.run(ak.lastInsertRowid, waterBased.lastInsertRowid, p[0], p[1], p[2], p[3], p[4])
  );

  vallejoPaints.forEach(p => 
    insertPaint.run(vallejo.lastInsertRowid, waterBased.lastInsertRowid, p[0], p[1], p[2], p[3], p[4])
  );
}

function initSprayGunSettings() {
  const types = db.prepare('SELECT * FROM paint_types').all();
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO spray_gun_settings (paint_type_id, clean_interval_minutes)
    VALUES (?, ?)
  `);
  
  types.forEach(type => {
    insertSetting.run(type.id, type.default_clean_interval);
  });
}

function getBrands() {
  return db.prepare('SELECT * FROM brands ORDER BY name').all();
}

function getPaintTypes() {
  return db.prepare('SELECT * FROM paint_types ORDER BY name').all();
}

function getPaintsByBrandAndType(brandId, typeId) {
  return db.prepare(`
    SELECT 
      p.*,
      b.name as brand_name,
      pt.name as type_name,
      up.custom_ratio_paint,
      up.custom_ratio_thinner
    FROM paints p
    JOIN brands b ON p.brand_id = b.id
    JOIN paint_types pt ON p.type_id = pt.id
    LEFT JOIN user_preferences up ON p.id = up.paint_id
    WHERE p.brand_id = ? AND p.type_id = ?
    ORDER BY p.code
  `).all(brandId, typeId);
}

function getPaintById(id) {
  return db.prepare(`
    SELECT 
      p.*,
      b.name as brand_name,
      pt.name as type_name,
      up.custom_ratio_paint,
      up.custom_ratio_thinner
    FROM paints p
    JOIN brands b ON p.brand_id = b.id
    JOIN paint_types pt ON p.type_id = pt.id
    LEFT JOIN user_preferences up ON p.id = up.paint_id
    WHERE p.id = ?
  `).get(id);
}

function saveUserPreference(paintId, ratioPaint, ratioThinner) {
  const existing = db.prepare('SELECT id FROM user_preferences WHERE paint_id = ?').get(paintId);
  
  if (existing) {
    return db.prepare(`
      UPDATE user_preferences 
      SET custom_ratio_paint = ?, custom_ratio_thinner = ?, updated_at = CURRENT_TIMESTAMP
      WHERE paint_id = ?
    `).run(ratioPaint, ratioThinner, paintId);
  } else {
    return db.prepare(`
      INSERT INTO user_preferences (paint_id, custom_ratio_paint, custom_ratio_thinner)
      VALUES (?, ?, ?)
    `).run(paintId, ratioPaint, ratioThinner);
  }
}

function deleteUserPreference(paintId) {
  return db.prepare('DELETE FROM user_preferences WHERE paint_id = ?').run(paintId);
}

function addMixingRecord(data) {
  const insertRecord = db.prepare(`
    INSERT INTO mixing_records (total_ml, total_paint_ml, total_thinner_ml, combined_ratio_paint, combined_ratio_thinner, recommended_pressure, is_mixed)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = insertRecord.run(
    data.totalMl,
    data.totalPaintMl,
    data.totalThinnerMl,
    data.combinedRatioPaint,
    data.combinedRatioThinner,
    data.recommendedPressure,
    data.items.length > 1 ? 1 : 0
  );
  
  const recordId = result.lastInsertRowid;
  
  const insertItem = db.prepare(`
    INSERT INTO mixing_record_items (record_id, paint_id, paint_ml, thinner_ml, mix_ratio_paint, mix_ratio_thinner, mix_proportion)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  data.items.forEach(item => {
    insertItem.run(
      recordId,
      item.paintId,
      item.paintMl,
      item.thinnerMl,
      item.ratioPaint,
      item.ratioThinner,
      item.mixProportion
    );
  });
  
  return { recordId };
}

function getMixingRecords(limit = 50) {
  const records = db.prepare(`
    SELECT * FROM mixing_records
    ORDER BY created_at DESC
    LIMIT ?
  `).all(limit);
  
  const itemsByRecord = {};
  const items = db.prepare(`
    SELECT 
      mri.*,
      p.code as paint_code,
      p.name as paint_name,
      b.name as brand_name,
      pt.name as type_name,
      pt.id as type_id
    FROM mixing_record_items mri
    JOIN paints p ON mri.paint_id = p.id
    JOIN brands b ON p.brand_id = b.id
    JOIN paint_types pt ON p.type_id = pt.id
  `).all();
  
  items.forEach(item => {
    if (!itemsByRecord[item.record_id]) {
      itemsByRecord[item.record_id] = [];
    }
    itemsByRecord[item.record_id].push(item);
  });
  
  return records.map(record => ({
    ...record,
    items: itemsByRecord[record.id] || []
  }));
}

function clearMixingHistory() {
  db.prepare('DELETE FROM mixing_record_items').run();
  return db.prepare('DELETE FROM mixing_records').run();
}

function getSprayGunSettings() {
  return db.prepare(`
    SELECT 
      sgs.*,
      pt.name as type_name
    FROM spray_gun_settings sgs
    JOIN paint_types pt ON sgs.paint_type_id = pt.id
    ORDER BY pt.name
  `).all();
}

function updateSprayGunSetting(paintTypeId, cleanIntervalMinutes) {
  const existing = db.prepare('SELECT id FROM spray_gun_settings WHERE paint_type_id = ?').get(paintTypeId);
  
  if (existing) {
    return db.prepare(`
      UPDATE spray_gun_settings 
      SET clean_interval_minutes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE paint_type_id = ?
    `).run(cleanIntervalMinutes, paintTypeId);
  } else {
    return db.prepare(`
      INSERT INTO spray_gun_settings (paint_type_id, clean_interval_minutes)
      VALUES (?, ?)
    `).run(paintTypeId, cleanIntervalMinutes);
  }
}

function startSprayGunUsage(paintTypeId) {
  return db.prepare(`
    INSERT INTO spray_gun_usage (paint_type_id, start_time)
    VALUES (?, CURRENT_TIMESTAMP)
  `).run(paintTypeId);
}

function endSprayGunUsage(usageId, usageMinutes) {
  return db.prepare(`
    UPDATE spray_gun_usage 
    SET usage_minutes = ?, end_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(usageMinutes, usageId);
}

function markSprayGunCleaned(usageId) {
  return db.prepare(`
    UPDATE spray_gun_usage 
    SET is_cleaned = 1, cleaned_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(usageId);
}

function markAllSprayGunCleaned() {
  return db.prepare(`
    UPDATE spray_gun_usage 
    SET is_cleaned = 1, cleaned_at = CURRENT_TIMESTAMP
    WHERE is_cleaned = 0
  `).run();
}

function getSprayGunUsageStatus() {
  const settings = getSprayGunSettings();
  
  const usageSummary = db.prepare(`
    SELECT 
      sgu.paint_type_id,
      pt.name as type_name,
      SUM(CASE WHEN sgu.is_cleaned = 0 THEN sgu.usage_minutes ELSE 0 END) as total_uncleaned_minutes,
      MAX(sgu.start_time) as last_usage_time,
      sgs.clean_interval_minutes
    FROM spray_gun_usage sgu
    JOIN paint_types pt ON sgu.paint_type_id = pt.id
    LEFT JOIN spray_gun_settings sgs ON sgu.paint_type_id = sgs.paint_type_id
    GROUP BY sgu.paint_type_id, pt.name, sgs.clean_interval_minutes
    ORDER BY last_usage_time DESC
  `).all();
  
  return {
    settings,
    usageSummary: usageSummary.map(item => ({
      ...item,
      needs_cleaning: item.total_uncleaned_minutes >= item.clean_interval_minutes,
      remaining_minutes: Math.max(0, item.clean_interval_minutes - item.total_uncleaned_minutes)
    }))
  };
}

function getUncleanedUsage() {
  return db.prepare(`
    SELECT 
      sgu.*,
      pt.name as type_name,
      sgs.clean_interval_minutes
    FROM spray_gun_usage sgu
    JOIN paint_types pt ON sgu.paint_type_id = pt.id
    LEFT JOIN spray_gun_settings sgs ON sgu.paint_type_id = sgs.paint_type_id
    WHERE sgu.is_cleaned = 0
    ORDER BY sgu.start_time DESC
  `).all();
}

module.exports = {
  initDatabase,
  getBrands,
  getPaintTypes,
  getPaintsByBrandAndType,
  getPaintById,
  saveUserPreference,
  deleteUserPreference,
  addMixingRecord,
  getMixingRecords,
  clearMixingHistory,
  getSprayGunSettings,
  updateSprayGunSetting,
  startSprayGunUsage,
  endSprayGunUsage,
  markSprayGunCleaned,
  markAllSprayGunCleaned,
  getSprayGunUsageStatus,
  getUncleanedUsage
};
