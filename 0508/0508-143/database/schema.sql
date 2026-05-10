-- 创建数据库
CREATE DATABASE IF NOT EXISTS beehive_management 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE beehive_management;

-- 蜂箱表
CREATE TABLE IF NOT EXISTS beehives (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    hive_number VARCHAR(50) NOT NULL UNIQUE,
    location VARCHAR(255),
    description TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_hive_number (hive_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 蜂箱记录表
CREATE TABLE IF NOT EXISTS hive_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    beehive_id BIGINT NOT NULL,
    record_date DATE NOT NULL,
    morning_temp DOUBLE,
    evening_temp DOUBLE,
    morning_humidity DOUBLE,
    evening_humidity DOUBLE,
    activity_level INT NOT NULL,
    outside_temp DOUBLE,
    outside_humidity DOUBLE,
    notes TEXT,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (beehive_id) REFERENCES beehives(id) ON DELETE CASCADE,
    UNIQUE KEY uk_beehive_date (beehive_id, record_date),
    INDEX idx_record_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 已有数据库添加湿度字段的SQL（如已创建过hive_records表，执行以下语句）
-- ALTER TABLE hive_records ADD COLUMN IF NOT EXISTS morning_humidity DOUBLE AFTER evening_temp;
-- ALTER TABLE hive_records ADD COLUMN IF NOT EXISTS evening_humidity DOUBLE AFTER morning_humidity;
-- ALTER TABLE hive_records ADD COLUMN IF NOT EXISTS outside_humidity DOUBLE AFTER outside_temp;

-- 蜜源植物表
CREATE TABLE IF NOT EXISTS nectar_sources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    season VARCHAR(50),
    required_degree_days DOUBLE NOT NULL,
    base_temp DOUBLE NOT NULL,
    typical_start_month INT,
    typical_end_month INT,
    description TEXT,
    active BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 温度记录表（用于积温计算）
CREATE TABLE IF NOT EXISTS temperature_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_date DATE NOT NULL UNIQUE,
    max_temp DOUBLE NOT NULL,
    min_temp DOUBLE NOT NULL,
    avg_temp DOUBLE,
    location VARCHAR(100),
    created_at DATETIME NOT NULL,
    INDEX idx_record_date (record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始化蜜源植物数据
INSERT INTO nectar_sources (name, season, required_degree_days, base_temp, typical_start_month, typical_end_month, description, active) 
SELECT '油菜', '春季', 800.0, 5.0, 3, 4, '春季主要蜜源，花期约20-30天', TRUE
WHERE NOT EXISTS (SELECT 1 FROM nectar_sources WHERE name = '油菜');

INSERT INTO nectar_sources (name, season, required_degree_days, base_temp, typical_start_month, typical_end_month, description, active) 
SELECT '洋槐', '春末夏初', 1200.0, 10.0, 5, 6, '优质蜜源，花期约10-15天', TRUE
WHERE NOT EXISTS (SELECT 1 FROM nectar_sources WHERE name = '洋槐');

INSERT INTO nectar_sources (name, season, required_degree_days, base_temp, typical_start_month, typical_end_month, description, active) 
SELECT '椴树', '夏季', 1800.0, 10.0, 7, 8, '夏季主要蜜源，花期约20天', TRUE
WHERE NOT EXISTS (SELECT 1 FROM nectar_sources WHERE name = '椴树');

INSERT INTO nectar_sources (name, season, required_degree_days, base_temp, typical_start_month, typical_end_month, description, active) 
SELECT '荞麦', '秋季', 600.0, 10.0, 9, 10, '秋季辅助蜜源，花期约25天', TRUE
WHERE NOT EXISTS (SELECT 1 FROM nectar_sources WHERE name = '荞麦');
