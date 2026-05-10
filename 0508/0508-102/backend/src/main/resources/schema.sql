-- 进度拍照打卡系统数据库初始化脚本

-- 创建数据库
CREATE DATABASE IF NOT EXISTS construction_progress DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE construction_progress;

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    role ENUM('WORKER', 'OWNER') NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 项目表
CREATE TABLE IF NOT EXISTS projects (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    owner_id BIGINT NOT NULL,
    owner_name VARCHAR(50) NOT NULL,
    address VARCHAR(255) NOT NULL,
    area DECIMAL(10, 2) NOT NULL,
    current_stage INT DEFAULT 0,
    status ENUM('ACTIVE', 'COMPLETED') DEFAULT 'ACTIVE',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_owner_id (owner_id),
    INDEX idx_status (status),
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 工序进度表
CREATE TABLE IF NOT EXISTS project_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    stage_index INT NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    progress DECIMAL(5, 2) DEFAULT 0,
    is_completed TINYINT(1) DEFAULT 0,
    completed_time DATETIME NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_project_stage (project_id, stage_index),
    INDEX idx_project_id (project_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 打卡记录表
CREATE TABLE IF NOT EXISTS check_ins (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    worker_id BIGINT NOT NULL,
    stage_index INT NOT NULL,
    stage_name VARCHAR(50) NOT NULL,
    daily_progress DECIMAL(5, 2) NOT NULL,
    description TEXT,
    image_url VARCHAR(255),
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_project_id (project_id),
    INDEX idx_stage_index (stage_index),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (worker_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 留言表
CREATE TABLE IF NOT EXISTS comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    owner_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    type ENUM('MESSAGE', 'URGE') DEFAULT 'MESSAGE',
    is_read TINYINT(1) DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_project_id (project_id),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入示例数据
INSERT INTO users (username, password, name, phone, role) VALUES 
('worker1', '$2a$10$vI8aWBnW3fID.ZQ1.dX36.k7y3C8gGd7j4yXqkq8jU6hG5F3eP5qK', '张三', '13800138001', 'WORKER'),
('worker2', '$2a$10$vI8aWBnW3fID.ZQ1.dX36.k7y3C8gGd7j4yXqkq8jU6hG5F3eP5qK', '李四', '13800138002', 'WORKER'),
('owner1', '$2a$10$vI8aWBnW3fID.ZQ1.dX36.k7y3C8gGd7j4yXqkq8jU6hG5F3eP5qK', '王五', '13800138003', 'OWNER'),
('owner2', '$2a$10$vI8aWBnW3fID.ZQ1.dX36.k7y3C8gGd7j4yXqkq8jU6hG5F3eP5qK', '赵六', '13800138004', 'OWNER');

INSERT INTO projects (owner_id, owner_name, address, area, current_stage, status) VALUES 
(3, '王五', '北京市朝阳区农村示范村1号', 200.00, 1, 'ACTIVE'),
(4, '赵六', '北京市海淀区新农村建设点5号', 180.00, 0, 'ACTIVE');

INSERT INTO project_stages (project_id, stage_index, stage_name, progress, is_completed) VALUES 
(1, 0, '地基', 100.00, 1),
(1, 1, '框架', 60.00, 0),
(1, 2, '砌墙', 0.00, 0),
(1, 3, '封顶', 0.00, 0),
(1, 4, '装修', 0.00, 0),
(2, 0, '地基', 30.00, 0),
(2, 1, '框架', 0.00, 0),
(2, 2, '砌墙', 0.00, 0),
(2, 3, '封顶', 0.00, 0),
(2, 4, '装修', 0.00, 0);

INSERT INTO check_ins (project_id, worker_id, stage_index, stage_name, daily_progress, description, image_url) VALUES 
(1, 1, 0, '地基', 50.00, '开始地基施工，浇筑混凝土', 'https://picsum.photos/800/600?random=1'),
(1, 1, 0, '地基', 50.00, '地基施工完成，质量验收通过', 'https://picsum.photos/800/600?random=2'),
(1, 2, 1, '框架', 30.00, '开始框架施工，搭建钢筋结构', 'https://picsum.photos/800/600?random=3'),
(1, 2, 1, '框架', 30.00, '框架进度过半，模板支设完成', 'https://picsum.photos/800/600?random=4'),
(2, 1, 0, '地基', 30.00, '地基开挖完成，准备浇筑', 'https://picsum.photos/800/600?random=5');

INSERT INTO comments (project_id, owner_id, content, type) VALUES 
(1, 3, '麻烦请加快一下框架施工的进度，谢谢！', 'URGE'),
(1, 3, '地基施工质量很好，辛苦了！', 'MESSAGE'),
(2, 4, '地基施工速度太慢了，请尽快完成！', 'URGE');
