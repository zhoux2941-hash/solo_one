-- 电影院爆米花机预热排班优化器 - 数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS popcorn_optimizer 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE popcorn_optimizer;

-- 客流量历史表
CREATE TABLE IF NOT EXISTS passenger_flow_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_date DATE NOT NULL COMMENT '记录日期',
    hour_of_day INT NOT NULL COMMENT '小时(0-23)',
    passenger_count INT NOT NULL COMMENT '客流量(人)',
    day_of_week INT COMMENT '星期几(1-7)',
    is_holiday BOOLEAN DEFAULT FALSE COMMENT '是否节假日',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_record_date (record_date),
    INDEX idx_hour_of_day (hour_of_day),
    INDEX idx_day_of_week (day_of_week),
    UNIQUE KEY uk_date_hour (record_date, hour_of_day)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='客流量历史记录表';

-- 插入一些示例历史数据
INSERT INTO passenger_flow_history (record_date, hour_of_day, passenger_count, day_of_week, is_holiday) VALUES
('2024-01-05', 17, 45, 5, FALSE),
('2024-01-05', 18, 80, 5, FALSE),
('2024-01-05', 19, 120, 5, FALSE),
('2024-01-05', 20, 100, 5, FALSE),
('2024-01-05', 21, 60, 5, FALSE),
('2024-01-06', 17, 55, 6, FALSE),
('2024-01-06', 18, 95, 6, FALSE),
('2024-01-06', 19, 150, 6, FALSE),
('2024-01-06', 20, 130, 6, FALSE),
('2024-01-06', 21, 80, 6, FALSE),
('2024-01-07', 17, 60, 7, TRUE),
('2024-01-07', 18, 110, 7, TRUE),
('2024-01-07', 19, 180, 7, TRUE),
('2024-01-07', 20, 160, 7, TRUE),
('2024-01-07', 21, 90, 7, TRUE);
