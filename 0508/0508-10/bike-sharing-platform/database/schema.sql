-- 创建数据库
CREATE DATABASE IF NOT EXISTS bike_sharing DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bike_sharing;

-- 停车点表
CREATE TABLE IF NOT EXISTS parking_point (
    point_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    capacity INT NOT NULL,
    current_bikes INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (latitude, longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 借还记录表
CREATE TABLE IF NOT EXISTS bike_record (
    record_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    point_id BIGINT NOT NULL,
    bike_id BIGINT NOT NULL,
    type ENUM('BORROW', 'RETURN') NOT NULL,
    time TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_point_time (point_id, time),
    INDEX idx_time (time),
    INDEX idx_type (type),
    FOREIGN KEY (point_id) REFERENCES parking_point(point_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
