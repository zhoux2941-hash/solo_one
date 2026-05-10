CREATE DATABASE IF NOT EXISTS fishing_log DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE fishing_log;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    eco_points INT DEFAULT 0,
    total_released INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fish_species (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    image VARCHAR(255),
    min_temp DECIMAL(5,2),
    max_temp DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS lures (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    brand VARCHAR(50),
    model VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    type VARCHAR(50),
    weight DECIMAL(5,2),
    image VARCHAR(255),
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_lure_model_color (model, color)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fishing_spots (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    latitude DECIMAL(10,7) NOT NULL,
    longitude DECIMAL(10,7) NOT NULL,
    description VARCHAR(255),
    water_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fishing_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    spot_id BIGINT,
    fish_species_id BIGINT NOT NULL,
    lure_id BIGINT NOT NULL,
    fish_date DATE NOT NULL,
    air_temp DECIMAL(5,2) NOT NULL,
    water_temp DECIMAL(5,2) NOT NULL,
    air_pressure DECIMAL(7,2) NOT NULL,
    weather VARCHAR(50),
    water_visibility VARCHAR(50),
    catch_count INT DEFAULT 1,
    release_count INT DEFAULT 0,
    eco_points_earned INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_fish_date (fish_date),
    INDEX idx_species (fish_species_id),
    INDEX idx_lure (lure_id),
    INDEX idx_release (release_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO fish_species (name, description, min_temp, max_temp) VALUES
('鲈鱼', '淡水路亚常见目标鱼种', 10.0, 30.0),
('鳜鱼', '珍贵淡水鱼种，性情凶猛', 15.0, 28.0),
('翘嘴', '淡水路亚经典鱼种', 12.0, 32.0),
('黑鱼', '伏击型掠食鱼类', 18.0, 35.0),
('罗非', '热带鱼类，适应力强', 20.0, 38.0),
('鲶鱼', '底栖食肉鱼类', 5.0, 30.0);

INSERT IGNORE INTO lures (brand, model, color, type, weight) VALUES
('美夏', '银刀', '红头白身', '米诺', 7.0),
('美夏', '银刀', '红头', '米诺', 7.0),
('美夏', '银刀', '夜光', '米诺', 7.0),
('EWE', '妖刀', '金色', 'VIB', 10.0),
('EWE', '妖刀', '银色', 'VIB', 10.0),
('EWE', '妖刀', '红头白身', 'VIB', 10.0),
('领峰', 'V8', '绿色', '铅笔', 15.0),
('领峰', 'V8', '黑色', '铅笔', 15.0),
('钓之屋', '诡道', '彩色', '波爬', 8.0),
('钓之屋', '诡道', '金色', '波爬', 8.0);
