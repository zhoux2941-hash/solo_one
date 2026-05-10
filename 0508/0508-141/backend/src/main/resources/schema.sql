-- 创建古琴调音工具数据库
CREATE DATABASE IF NOT EXISTS guqin_tuner DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE guqin_tuner;

-- 古琴表
CREATE TABLE IF NOT EXISTS guqin (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '琴名',
    string_length DECIMAL(10, 2) NOT NULL COMMENT '有效弦长（mm）',
    description TEXT COMMENT '描述',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='古琴表';

-- 调音记录表
CREATE TABLE IF NOT EXISTS tuning_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    guqin_id BIGINT NOT NULL COMMENT '古琴ID',
    record_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '记录时间',
    notes TEXT COMMENT '备注',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_guqin_id (guqin_id),
    FOREIGN KEY (guqin_id) REFERENCES guqin(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='调音记录表';

-- 徽位音准详情表
CREATE TABLE IF NOT EXISTS hui_position_detail (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tuning_record_id BIGINT NOT NULL COMMENT '调音记录ID',
    hui_number INT NOT NULL COMMENT '徽位编号（1-13）',
    theoretical_frequency DECIMAL(10, 4) NOT NULL COMMENT '理论频率（Hz）',
    measured_frequency DECIMAL(10, 4) NOT NULL COMMENT '实测频率（Hz）',
    cent_deviation DECIMAL(10, 4) NOT NULL COMMENT '音分偏差',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_record_id (tuning_record_id),
    FOREIGN KEY (tuning_record_id) REFERENCES tuning_record(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='徽位音准详情表';
