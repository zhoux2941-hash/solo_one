-- 创建数据库
CREATE DATABASE IF NOT EXISTS student_union_budget DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE student_union_budget;

-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    role ENUM('ADMIN', 'LEADER') NOT NULL DEFAULT 'LEADER',
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 活动表
CREATE TABLE IF NOT EXISTS activity (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100) NOT NULL,
    budget_total DECIMAL(10,2) NOT NULL,
    status ENUM('CREATED', 'SUBMITTED', 'APPROVED', 'REJECTED', 'CLOSED') NOT NULL DEFAULT 'CREATED',
    actual_total DECIMAL(10,2) DEFAULT 0,
    created_by BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 预算细项表
CREATE TABLE IF NOT EXISTS budget_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    activity_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 决算细项表
CREATE TABLE IF NOT EXISTS actual_item (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    activity_id BIGINT NOT NULL,
    item_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 预算变更记录表
CREATE TABLE IF NOT EXISTS budget_change (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    activity_id BIGINT NOT NULL,
    original_budget DECIMAL(10,2) NOT NULL,
    new_budget DECIMAL(10,2) NOT NULL,
    change_amount DECIMAL(10,2) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    created_by BIGINT NOT NULL,
    reviewed_by BIGINT,
    review_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES activity(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES user(id),
    FOREIGN KEY (reviewed_by) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入初始数据
INSERT INTO user (username, password, name, role, department) VALUES 
('admin', 'admin123', '管理员', 'ADMIN', '学生会'),
('leader1', 'leader123', '宣传部长', 'LEADER', '宣传部'),
('leader2', 'leader123', '文艺部长', 'LEADER', '文艺部'),
('leader3', 'leader123', '体育部长', 'LEADER', '体育部');

INSERT INTO activity (name, department, budget_total, status, created_by) VALUES 
('校园文化节开幕式', '文艺部', 5000.00, 'CREATED', 2),
('新生运动会', '体育部', 8000.00, 'CREATED', 3),
('毕业季宣传', '宣传部', 3000.00, 'CREATED', 4);

INSERT INTO budget_item (activity_id, item_name, amount) VALUES 
(1, '场地布置', 2000.00),
(1, '音响设备', 1500.00),
(1, '服装道具', 1500.00),
(2, '场地租赁', 3000.00),
(2, '奖品购置', 3000.00),
(2, '宣传物料', 2000.00),
(3, '海报设计', 1000.00),
(3, '视频制作', 2000.00);
