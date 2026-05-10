CREATE DATABASE IF NOT EXISTS plant_reminder CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE plant_reminder;

CREATE TABLE IF NOT EXISTS plants (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    species VARCHAR(100) NOT NULL,
    watering_interval_days INT NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_watered_at TIMESTAMP NULL,
    next_watering_date DATE NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS watering_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    plant_id BIGINT NOT NULL,
    watered_by VARCHAR(100) NOT NULL,
    watered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes VARCHAR(255),
    FOREIGN KEY (plant_id) REFERENCES plants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO plants (name, species, watering_interval_days, location) VALUES
('绿萝1号', '绿萝', 3, '前台左侧'),
('绿萝2号', '绿萝', 3, '前台右侧'),
('发财树A', '发财树', 7, '办公室A区'),
('发财树B', '发财树', 7, '办公室B区'),
('多肉组合1', '多肉', 10, '会议桌'),
('多肉组合2', '多肉', 10, '茶水间'),
('吊兰A', '吊兰', 4, '窗边1'),
('吊兰B', '吊兰', 4, '窗边2'),
('虎皮兰', '虎皮兰', 14, '仓库门口'),
('文竹', '文竹', 5, '经理办公室'),
('富贵竹A', '富贵竹', 6, '走廊左侧'),
('富贵竹B', '富贵竹', 6, '走廊右侧');
