-- 价格动态调整相关表

USE pet_boarding;

CREATE TABLE IF NOT EXISTS price_adjustment_log (
    adjustment_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    room_type VARCHAR(50) NOT NULL,
    original_price DECIMAL(10, 2) NOT NULL,
    adjusted_price DECIMAL(10, 2) NOT NULL,
    adjustment_type ENUM('INCREASE', 'DECREASE') NOT NULL,
    adjustment_percentage DECIMAL(5, 2) NOT NULL,
    reason VARCHAR(255),
    occupancy_rate DECIMAL(5, 2),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('SUGGESTED', 'APPLIED', 'CANCELLED') DEFAULT 'SUGGESTED',
    applied_by BIGINT,
    applied_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_room_id (room_id),
    INDEX idx_room_type (room_type),
    INDEX idx_status (status),
    INDEX idx_date_range (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS price_adjustment_rule (
    rule_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    rule_name VARCHAR(100) NOT NULL,
    rule_type ENUM('OCCUPANCY_BASED', 'TIME_BASED', 'EVENT_BASED') DEFAULT 'OCCUPANCY_BASED',
    lower_threshold DECIMAL(5, 2) COMMENT '入住率下限，低于此值触发',
    upper_threshold DECIMAL(5, 2) COMMENT '入住率上限，高于此值触发',
    adjustment_percentage DECIMAL(5, 2) NOT NULL,
    priority INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO price_adjustment_rule (rule_name, rule_type, lower_threshold, upper_threshold, adjustment_percentage, priority, is_active) VALUES
('低价促销策略', 'OCCUPANCY_BASED', NULL, 30.00, -10.00, 1, TRUE),
('旺季涨价策略', 'OCCUPANCY_BASED', 90.00, NULL, 5.00, 2, TRUE);
