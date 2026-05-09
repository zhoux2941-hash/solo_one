-- 并发安全增强：添加预约冲突检测的辅助表和唯一约束

USE pet_boarding;

CREATE TABLE IF NOT EXISTS room_occupancy (
    occupancy_id BIGINT PRIMARY KEY AUTO_INCREMENT,
    room_id BIGINT NOT NULL,
    occupancy_date DATE NOT NULL,
    booking_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_room_date (room_id, occupancy_date),
    INDEX idx_booking_id (booking_id),
    INDEX idx_date (occupancy_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 这个表用于在数据库层面防止同一房间同一天被重复预约
-- 通过 UNIQUE KEY uk_room_date (room_id, occupancy_date) 确保
