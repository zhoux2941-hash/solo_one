-- 创建数据库
CREATE DATABASE IF NOT EXISTS light_pollution DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE light_pollution;

-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    nickname VARCHAR(50),
    avatar VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 位置聚合表（聚合同一位置的多次观测）
CREATE TABLE IF NOT EXISTS location (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    coord_hash VARCHAR(64) NOT NULL,
    location_name VARCHAR(100),
    latest_magnitude INT,
    average_magnitude DECIMAL(5, 2),
    min_magnitude INT,
    max_magnitude INT,
    magnitude_trend DOUBLE COMMENT '趋势斜率，正值表示星等升高（暗夜改善）',
    observation_count INT DEFAULT 0,
    first_observation_at TIMESTAMP NULL,
    latest_observation_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_coord_hash (coord_hash),
    INDEX idx_user_id (user_id),
    INDEX idx_coords (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 观测记录表（用户每次提交的历史记录）
CREATE TABLE IF NOT EXISTS observation (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    location_id BIGINT,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    magnitude INT NOT NULL COMMENT '目视极限星等 1-6',
    location_name VARCHAR(100),
    description TEXT,
    weather VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_location_id (location_id),
    INDEX idx_coords (latitude, longitude),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (location_id) REFERENCES location(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 暗夜挑战活动表
CREATE TABLE IF NOT EXISTS challenge (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' COMMENT 'ACTIVE, COMPLETED, FAILED',
    streak_days INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 挑战每日打卡记录表
CREATE TABLE IF NOT EXISTS challenge_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    challenge_id BIGINT NOT NULL,
    observation_id BIGINT NOT NULL,
    log_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_log_date (log_date),
    UNIQUE KEY uk_challenge_date (challenge_id, log_date),
    FOREIGN KEY (challenge_id) REFERENCES challenge(id) ON DELETE CASCADE,
    FOREIGN KEY (observation_id) REFERENCES observation(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
