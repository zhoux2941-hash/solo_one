CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'teacher',
    department TEXT,
    phone TEXT,
    create_time TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS reagent (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT,
    specification TEXT,
    unit TEXT DEFAULT '瓶',
    quantity INTEGER DEFAULT 0,
    location TEXT,
    description TEXT,
    expiry_date TEXT,
    create_time TEXT DEFAULT (datetime('now','localtime')),
    update_time TEXT DEFAULT (datetime('now','localtime'))
);

CREATE TABLE IF NOT EXISTS requisition (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    reagent_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    purpose TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    create_time TEXT DEFAULT (datetime('now','localtime')),
    update_time TEXT DEFAULT (datetime('now','localtime')),
    approver_id INTEGER,
    remark TEXT
);

CREATE TABLE IF NOT EXISTS requisition_record (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requisition_id INTEGER,
    user_id INTEGER NOT NULL,
    reagent_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    purpose TEXT,
    operation_type TEXT NOT NULL,
    operation_time TEXT DEFAULT (datetime('now','localtime')),
    operator_id INTEGER
);

INSERT OR IGNORE INTO user (username, password, name, role, department, phone) VALUES
('admin', '123456', '管理员', 'admin', '实验室管理处', '13800000001'),
('teacher1', '123456', '张老师', 'teacher', '化学系', '13800000002'),
('teacher2', '123456', '李老师', 'teacher', '物理系', '13800000003');

INSERT OR IGNORE INTO reagent (name, category, specification, unit, quantity, location, description, expiry_date) VALUES
('乙醇', '有机溶剂', '分析纯 500ml', '瓶', 100, 'A-01-01', '无水乙醇，用于实验清洗', datetime('now','+2 years')),
('盐酸', '酸类', '分析纯 500ml', '瓶', 50, 'B-02-03', '36% 盐酸溶液', datetime('now','+1 year')),
('氢氧化钠', '碱类', '分析纯 500g', '瓶', 80, 'C-03-02', '片状氢氧化钠', datetime('now','+1 month')),
('氯化钠', '盐类', '分析纯 500g', '瓶', 120, 'D-01-04', '氯化钠试剂', datetime('now','+6 months')),
('硫酸', '酸类', '分析纯 500ml', '瓶', 30, 'B-02-05', '98% 硫酸溶液', datetime('now','-1 month')),
('氨水', '碱类', '分析纯 500ml', '瓶', 60, 'C-03-06', '25% 氨水溶液', datetime('now','+10 days'));
