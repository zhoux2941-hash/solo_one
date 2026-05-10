CREATE DATABASE IF NOT EXISTS charging_pile_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE charging_pile_db;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    student_id VARCHAR(20) UNIQUE,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'STUDENT',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS charging_piles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pile_code VARCHAR(20) NOT NULL UNIQUE,
    location VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    description VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pile_code (pile_code),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    pile_id BIGINT NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    actual_start_time DATETIME,
    actual_end_time DATETIME,
    expired_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_pile_id (pile_id),
    INDEX idx_status (status),
    INDEX idx_time (start_time, end_time),
    INDEX idx_expired_at (expired_at),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (pile_id) REFERENCES charging_piles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fault_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    pile_id BIGINT NOT NULL,
    reporter_id BIGINT NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    handler_id BIGINT,
    handle_note TEXT,
    reported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    handled_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_pile_id (pile_id),
    INDEX idx_status (status),
    INDEX idx_reporter_id (reporter_id),
    FOREIGN KEY (pile_id) REFERENCES charging_piles(id),
    FOREIGN KEY (reporter_id) REFERENCES users(id),
    FOREIGN KEY (handler_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO users (username, password, real_name, student_id, role) VALUES 
('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', NULL, 'ADMIN'),
('student1', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '张三', '2024001', 'STUDENT'),
('student2', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '李四', '2024002', 'STUDENT');

INSERT INTO charging_piles (pile_code, location, status, description) VALUES 
('CP001', '一号宿舍楼楼下', 'AVAILABLE', '标准充电桩'),
('CP002', '一号宿舍楼楼下', 'AVAILABLE', '标准充电桩'),
('CP003', '二号宿舍楼楼下', 'AVAILABLE', '快充充电桩'),
('CP004', '二号宿舍楼楼下', 'AVAILABLE', '快充充电桩'),
('CP005', '图书馆门口', 'AVAILABLE', '标准充电桩'),
('CP006', '图书馆门口', 'AVAILABLE', '标准充电桩'),
('CP007', '食堂旁边', 'AVAILABLE', '快充充电桩'),
('CP008', '食堂旁边', 'AVAILABLE', '标准充电桩');
