CREATE DATABASE IF NOT EXISTS gym_booking DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gym_booking;

CREATE TABLE IF NOT EXISTS course (
    course_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT '课程名称',
    coach_id BIGINT NOT NULL COMMENT '教练ID',
    coach_name VARCHAR(50) NOT NULL COMMENT '教练姓名',
    start_time DATETIME NOT NULL COMMENT '课程开始时间',
    end_time DATETIME NOT NULL COMMENT '课程结束时间',
    capacity INT NOT NULL COMMENT '课程容量',
    description TEXT COMMENT '课程描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_coach_id (coach_id),
    INDEX idx_start_time (start_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS booking (
    booking_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL COMMENT '用户ID',
    user_name VARCHAR(50) NOT NULL COMMENT '用户姓名',
    course_id BIGINT NOT NULL COMMENT '课程ID',
    status VARCHAR(20) NOT NULL DEFAULT 'BOOKED' COMMENT '状态: BOOKED-预约, CHECKED_IN-签到, NO_SHOW-爽约',
    book_time DATETIME NOT NULL COMMENT '预约时间',
    checkin_time DATETIME COMMENT '签到时间',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_course (user_id, course_id),
    INDEX idx_course_id (course_id),
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    FOREIGN KEY (course_id) REFERENCES course(course_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO course (name, coach_id, coach_name, start_time, end_time, capacity, description) VALUES 
('瑜伽基础课', 1, '张教练', '2026-05-10 09:00:00', '2026-05-10 10:00:00', 20, '适合初学者的瑜伽课程'),
('动感单车', 2, '李教练', '2026-05-10 10:30:00', '2026-05-10 11:30:00', 25, '高强度有氧训练'),
('普拉提', 1, '张教练', '2026-05-10 14:00:00', '2026-05-10 15:00:00', 15, '核心力量训练'),
('HIIT训练', 3, '王教练', '2026-05-10 18:00:00', '2026-05-10 19:00:00', 30, '高强度间歇训练'),
('瑜伽基础课', 1, '张教练', '2026-05-11 09:00:00', '2026-05-11 10:00:00', 20, '适合初学者的瑜伽课程'),
('动感单车', 2, '李教练', '2026-05-11 10:30:00', '2026-05-11 11:30:00', 25, '高强度有氧训练'),
('普拉提', 1, '张教练', '2026-05-12 14:00:00', '2026-05-12 15:00:00', 15, '核心力量训练'),
('HIIT训练', 3, '王教练', '2026-05-12 18:00:00', '2026-05-12 19:00:00', 30, '高强度间歇训练');
