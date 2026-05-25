CREATE TABLE IF NOT EXISTS regions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    type TEXT NOT NULL,
    region_id INTEGER,
    status TEXT DEFAULT 'offline',
    ip_address TEXT,
    last_online DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS device_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS device_group_members (
    group_id INTEGER,
    device_id INTEGER,
    PRIMARY KEY (group_id, device_id),
    FOREIGN KEY (group_id) REFERENCES device_groups(id),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE IF NOT EXISTS broadcast_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    content TEXT,
    audio_url TEXT,
    duration INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS broadcast_batches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    template_id INTEGER,
    priority INTEGER DEFAULT 5,
    status TEXT DEFAULT 'pending',
    scheduled_time DATETIME,
    end_time DATETIME,
    region_ids TEXT,
    device_ids TEXT,
    group_ids TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (template_id) REFERENCES broadcast_templates(id)
);

CREATE TABLE IF NOT EXISTS publish_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id INTEGER,
    device_id INTEGER,
    status TEXT,
    published_at DATETIME,
    completed_at DATETIME,
    error_message TEXT,
    playback_count INTEGER DEFAULT 0,
    FOREIGN KEY (batch_id) REFERENCES broadcast_batches(id),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE IF NOT EXISTS playback_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    publish_record_id INTEGER,
    start_time DATETIME,
    end_time DATETIME,
    duration INTEGER,
    FOREIGN KEY (publish_record_id) REFERENCES publish_records(id)
);

INSERT OR IGNORE INTO regions (name, code, level) VALUES 
('东城区', 'DC001', 1),
('西城区', 'XC001', 1),
('南村镇', 'NC001', 2),
('北港镇', 'BG001', 2);

INSERT OR IGNORE INTO devices (name, code, type, region_id, status) VALUES 
('东城区村部广播', 'DC-001', 'village', 1, 'online'),
('东城区一组广播', 'DC-002', 'village', 1, 'online'),
('西城区村部广播', 'XC-001', 'village', 2, 'offline'),
('南村镇巡堤广播1号', 'NC-XD-001', 'patrol', 3, 'online'),
('南村镇巡堤广播2号', 'NC-XD-002', 'patrol', 3, 'online'),
('北港镇撤离广播', 'BG-CL-001', 'evacuation', 4, 'online');

INSERT OR IGNORE INTO device_groups (name, description) VALUES 
('东城区广播组', '东城区所有广播设备'),
('巡堤专用组', '用于巡堤通知的设备组'),
('应急撤离组', '紧急撤离时使用的设备组');

INSERT OR IGNORE INTO device_group_members (group_id, device_id) VALUES 
(1, 1), (1, 2),
(2, 4), (2, 5),
(3, 6);

INSERT OR IGNORE INTO broadcast_templates (name, type, content, duration) VALUES 
('村组早间播报', 'village', '各位村民早上好，今天是汛期，请关注天气变化，注意安全。', 30),
('巡堤通知', 'patrol', '巡堤人员请注意，当前水位正常，请加强巡查频次，发现异常及时报告。', 45),
('临时撤离警示', 'evacuation', '紧急通知！请所有村民立即撤离到安全地带，携带好贵重物品，听从指挥有序撤离。', 60),
('水位预警', 'warning', '水位预警通知：当前水位已达到警戒水位，请相关区域人员做好撤离准备。', 50);
