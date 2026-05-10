CREATE DATABASE IF NOT EXISTS tide_monitor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tide_monitor;

CREATE TABLE IF NOT EXISTS locations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    UNIQUE KEY uk_location (latitude, longitude),
    INDEX idx_lat_lng (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tide_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    location_id BIGINT NOT NULL,
    record_time DATETIME NOT NULL,
    theoretical_height DOUBLE NOT NULL,
    actual_height DOUBLE,
    photo_path VARCHAR(500),
    notes VARCHAR(500),
    created_at DATETIME NOT NULL,
    updated_at DATETIME NOT NULL,
    INDEX idx_location_time (location_id, record_time),
    INDEX idx_record_time (record_time),
    CONSTRAINT fk_tide_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS moon_phases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    date DATE NOT NULL,
    phase DOUBLE NOT NULL,
    phase_name VARCHAR(50) NOT NULL,
    illumination DOUBLE NOT NULL,
    moonrise_time TIME,
    moonset_time TIME,
    meridian_time TIME,
    UNIQUE KEY uk_moon_date (date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO locations (name, latitude, longitude, created_at, updated_at) VALUES
('上海外滩', 31.2304, 121.4737, NOW(), NOW()),
('青岛栈桥', 36.0671, 120.3826, NOW(), NOW()),
('厦门鼓浪屿', 24.4418, 118.0751, NOW(), NOW());
