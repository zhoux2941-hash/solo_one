-- 创建数据库
CREATE DATABASE IF NOT EXISTS driving_school DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE driving_school;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL COMMENT '用户名',
    `password` VARCHAR(100) NOT NULL COMMENT '密码',
    `name` VARCHAR(50) NOT NULL COMMENT '姓名',
    `phone` VARCHAR(20) COMMENT '手机号',
    `role` VARCHAR(20) NOT NULL COMMENT '角色：STUDENT-学员，COACH-教练',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1-启用，0-禁用',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 教练表
CREATE TABLE IF NOT EXISTS `coach` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '教练ID',
    `user_id` BIGINT NOT NULL COMMENT '关联用户ID',
    `car_model` VARCHAR(50) NOT NULL COMMENT '车型',
    `avg_rating` DECIMAL(3,2) DEFAULT 0.00 COMMENT '平均评分',
    `rating_count` INT DEFAULT 0 COMMENT '评分次数',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='教练表';

-- 时段表
CREATE TABLE IF NOT EXISTS `time_slot` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '时段ID',
    `coach_id` BIGINT NOT NULL COMMENT '教练ID',
    `slot_date` DATE NOT NULL COMMENT '日期',
    `start_hour` INT NOT NULL COMMENT '开始小时（0-23）',
    `status` TINYINT DEFAULT 0 COMMENT '状态：0-未设置，1-可预约，2-已预约，3-已锁定',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_coach_date_hour` (`coach_id`, `slot_date`, `start_hour`),
    KEY `idx_coach_id` (`coach_id`),
    KEY `idx_date` (`slot_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='时段表';

-- 预约表
CREATE TABLE IF NOT EXISTS `booking` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '预约ID',
    `student_id` BIGINT NOT NULL COMMENT '学员ID',
    `coach_id` BIGINT NOT NULL COMMENT '教练ID',
    `slot_id` BIGINT NOT NULL COMMENT '时段ID',
    `booking_date` DATE NOT NULL COMMENT '预约日期',
    `start_hour` INT NOT NULL COMMENT '开始小时',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1-已预约，2-已完成，3-已取消',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_coach_id` (`coach_id`),
    KEY `idx_slot_id` (`slot_id`),
    KEY `idx_booking_date` (`booking_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='预约表';

-- 评分表
CREATE TABLE IF NOT EXISTS `rating` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '评分ID',
    `booking_id` BIGINT NOT NULL COMMENT '预约ID',
    `student_id` BIGINT NOT NULL COMMENT '学员ID',
    `coach_id` BIGINT NOT NULL COMMENT '教练ID',
    `score` TINYINT NOT NULL COMMENT '评分：1-5星',
    `comment` TEXT COMMENT '评语',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_booking_id` (`booking_id`),
    KEY `idx_student_id` (`student_id`),
    KEY `idx_coach_id` (`coach_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评分表';

-- 插入测试数据
-- 教练用户（密码：123456 BCrypt加密后）
INSERT INTO `user` (`username`, `password`, `name`, `phone`, `role`) VALUES
('coach001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7i/kti7yG', '张教练', '13800138001', 'COACH'),
('coach002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7i/kti7yG', '李教练', '13800138002', 'COACH');

-- 教练信息
INSERT INTO `coach` (`user_id`, `car_model`, `avg_rating`, `rating_count`) VALUES
(1, '大众朗逸', 4.50, 10),
(2, '丰田卡罗拉', 4.80, 15);

-- 学员用户
INSERT INTO `user` (`username`, `password`, `name`, `phone`, `role`) VALUES
('student001', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7i/kti7yG', '王学员', '13900139001', 'STUDENT'),
('student002', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7i/kti7yG', '赵学员', '13900139002', 'STUDENT');