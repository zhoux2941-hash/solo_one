-- 创建数据库
CREATE DATABASE IF NOT EXISTS logistics_track DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE logistics_track;

-- 包裹表
CREATE TABLE IF NOT EXISTS packages (
    package_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_no VARCHAR(50) NOT NULL UNIQUE COMMENT '包裹单号',
    sender VARCHAR(100) NOT NULL COMMENT '发件人',
    sender_city VARCHAR(50) NOT NULL COMMENT '发件城市',
    receiver VARCHAR(100) NOT NULL COMMENT '收件人',
    receiver_city VARCHAR(50) NOT NULL COMMENT '收件城市',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    current_status VARCHAR(20) NOT NULL DEFAULT 'PICKUP' COMMENT '当前状态',
    INDEX idx_package_no (package_no),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='包裹信息表';

-- 轨迹表
CREATE TABLE IF NOT EXISTS tracks (
    track_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    package_id BIGINT NOT NULL COMMENT '包裹ID',
    location VARCHAR(100) NOT NULL COMMENT '位置/转运中心',
    status VARCHAR(20) NOT NULL COMMENT '状态',
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '时间戳',
    latitude DOUBLE NOT NULL COMMENT '纬度',
    longitude DOUBLE NOT NULL COMMENT '经度',
    remark VARCHAR(255) COMMENT '备注',
    INDEX idx_package_id (package_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_status (status),
    FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='轨迹记录表';

-- 查看表结构
SHOW TABLES;
