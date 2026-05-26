-- 检查项费用表
CREATE TABLE IF NOT EXISTS exam_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  price REAL NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 病历模板表
CREATE TABLE IF NOT EXISTS templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  pet_type TEXT NOT NULL,
  symptoms TEXT,
  exam_checklist TEXT,
  treatment_plan TEXT,
  diagnosis TEXT,
  prescription TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 病历主表
CREATE TABLE IF NOT EXISTS medical_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pet_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_phone TEXT,
  pet_type TEXT,
  breed TEXT,
  age TEXT,
  gender TEXT,
  weight REAL,
  temperature REAL,
  chief_complaint TEXT,
  clinical_findings TEXT,
  diagnosis TEXT,
  prescription TEXT,
  treatment_plan TEXT,
  doctor_name TEXT,
  total_fee REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 病历-检查项关联表
CREATE TABLE IF NOT EXISTS record_exams (
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

-- 药品库存表
CREATE TABLE IF NOT EXISTS medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  specification TEXT,
  unit TEXT NOT NULL DEFAULT '盒',
  price REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 10,
  category TEXT,
  description TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 病历-药品关联表
CREATE TABLE IF NOT EXISTS record_medicines (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  record_id INTEGER NOT NULL,
  medicine_id INTEGER NOT NULL,
  medicine_name TEXT NOT NULL,
  specification TEXT,
  unit TEXT NOT NULL DEFAULT '盒',
  unit_price REAL NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  usage TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id)
);

-- 索引优化 - 确保查询 < 1秒
CREATE INDEX IF NOT EXISTS idx_records_created_at ON medical_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_records_pet_name ON medical_records(pet_name);
CREATE INDEX IF NOT EXISTS idx_records_owner_name ON medical_records(owner_name);
CREATE INDEX IF NOT EXISTS idx_records_pet_type ON medical_records(pet_type);
CREATE INDEX IF NOT EXISTS idx_record_exams_record_id ON record_exams(record_id);
CREATE INDEX IF NOT EXISTS idx_templates_pet_type ON templates(pet_type);
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_record_medicines_record_id ON record_medicines(record_id);
CREATE INDEX IF NOT EXISTS idx_record_medicines_medicine_id ON record_medicines(medicine_id);
