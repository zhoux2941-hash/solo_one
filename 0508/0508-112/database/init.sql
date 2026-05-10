-- 拼车系统数据库初始化脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS carpool DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE carpool;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    credit_score INT NOT NULL DEFAULT 100,
    completed_rides INT NOT NULL DEFAULT 0,
    canceled_rides INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL,
    INDEX idx_credit_score (credit_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 行程表
CREATE TABLE IF NOT EXISTS trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    publisher_id BIGINT NOT NULL,
    departure_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    waypoints VARCHAR(500),
    departure_time DATETIME NOT NULL,
    total_seats INT NOT NULL,
    available_seats INT NOT NULL,
    cost_per_person DECIMAL(10, 2) NOT NULL,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL,
    INDEX idx_destination_time (destination_city, departure_time),
    INDEX idx_destination (destination_city),
    INDEX idx_status (status),
    INDEX idx_publisher (publisher_id),
    FOREIGN KEY (publisher_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 拼车申请表
CREATE TABLE IF NOT EXISTS carpool_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL,
    requester_id BIGINT NOT NULL,
    seats_requested INT NOT NULL DEFAULT 1,
    message VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL,
    responded_at DATETIME,
    INDEX idx_trip (trip_id),
    INDEX idx_requester (requester_id),
    INDEX idx_status (status),
    UNIQUE KEY uk_trip_requester (trip_id, requester_id),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (requester_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 拼车小组表
CREATE TABLE IF NOT EXISTS carpool_groups (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    trip_id BIGINT NOT NULL UNIQUE,
    leader_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at DATETIME NOT NULL,
    INDEX idx_leader (leader_id),
    INDEX idx_status (status),
    FOREIGN KEY (trip_id) REFERENCES trips(id),
    FOREIGN KEY (leader_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 小组成员关联表
CREATE TABLE IF NOT EXISTS group_members (
    group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (group_id, user_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (group_id) REFERENCES carpool_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 留言表
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    group_id BIGINT NOT NULL,
    sender_id BIGINT NOT NULL,
    content VARCHAR(1000) NOT NULL,
    created_at DATETIME NOT NULL,
    INDEX idx_group (group_id),
    INDEX idx_sender (sender_id),
    FOREIGN KEY (group_id) REFERENCES carpool_groups(id),
    FOREIGN KEY (sender_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 热门城市统计表（用于Redis缓存策略）
CREATE TABLE IF NOT EXISTS hot_cities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    city_name VARCHAR(100) NOT NULL UNIQUE,
    search_count INT NOT NULL DEFAULT 0,
    trip_count INT NOT NULL DEFAULT 0,
    last_updated DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_search_count (search_count),
    INDEX idx_trip_count (trip_count)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入一些示例热门城市
INSERT INTO hot_cities (city_name, search_count, trip_count) VALUES
('北京', 1500, 320),
('上海', 1800, 450),
('广州', 1200, 280),
('深圳', 1100, 260),
('成都', 900, 220),
('杭州', 850, 200),
('武汉', 800, 190),
('南京', 750, 180),
('西安', 700, 170),
('重庆', 680, 160)
ON DUPLICATE KEY UPDATE search_count = search_count;

-- 示例用户（密码为123456，已加密）
INSERT INTO users (username, password, real_name, phone, credit_score, created_at) VALUES
('zhang_san', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张三', '13800138001', 100, NOW()),
('li_si', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李四', '13800138002', 95, NOW()),
('wang_wu', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '王五', '13800138003', 102, NOW())
ON DUPLICATE KEY UPDATE username = username;
