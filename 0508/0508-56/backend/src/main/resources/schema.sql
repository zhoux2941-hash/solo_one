CREATE DATABASE IF NOT EXISTS swimming_lane DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE swimming_lane;

CREATE TABLE IF NOT EXISTS speed_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(255),
    speed DOUBLE NOT NULL,
    recommended_lane_id INT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS user_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    speed_history_id BIGINT,
    user_id VARCHAR(255),
    recommended_lane_id INT NOT NULL,
    actual_lane_id INT NOT NULL,
    speed DOUBLE NOT NULL,
    is_match BOOLEAN,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_actual_lane_id (actual_lane_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;