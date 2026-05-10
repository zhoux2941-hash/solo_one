CREATE DATABASE IF NOT EXISTS lost_found DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE lost_found;

DROP TABLE IF EXISTS user;
DROP TABLE IF EXISTS lost_item;
DROP TABLE IF EXISTS found_item;
DROP TABLE IF EXISTS match_record;
DROP TABLE IF EXISTS message;

CREATE TABLE user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    nickname VARCHAR(50),
    phone VARCHAR(20),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lost_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    lost_time DATETIME NOT NULL,
    description TEXT,
    status TINYINT DEFAULT 0 COMMENT '0:寻找中 1:已认领',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_item_name (item_name),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE found_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    location VARCHAR(200) NOT NULL,
    found_time DATETIME NOT NULL,
    description TEXT,
    storage_location VARCHAR(200),
    status TINYINT DEFAULT 0 COMMENT '0:待认领 1:已认领',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_status (status),
    INDEX idx_item_name (item_name),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE match_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lost_item_id BIGINT NOT NULL,
    found_item_id BIGINT NOT NULL,
    match_score DECIMAL(5,2) NOT NULL,
    status TINYINT DEFAULT 0 COMMENT '0:待确认 1:已确认 2:已拒绝',
    confirmed_by VARCHAR(20) COMMENT '谁确认了：LOST_USER/FLOUND_USER',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_lost_id (lost_item_id),
    INDEX idx_found_id (found_item_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE message (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    receiver_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    is_read TINYINT DEFAULT 0,
    related_match_id BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_receiver (receiver_id),
    INDEX idx_read_status (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO user (username, password, nickname) VALUES
('test1', '123456', '测试用户1'),
('test2', '123456', '测试用户2');
