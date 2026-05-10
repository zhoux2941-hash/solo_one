-- 创建数据库
CREATE DATABASE IF NOT EXISTS milk_tea DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE milk_tea;

-- 茶底表
CREATE TABLE IF NOT EXISTS tea_base (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '茶底名称',
    description VARCHAR(200) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='茶底表';

-- 小料表
CREATE TABLE IF NOT EXISTS topping (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL COMMENT '小料名称',
    description VARCHAR(200) COMMENT '描述',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) COMMENT='小料表';

-- 历史评分记录表
CREATE TABLE IF NOT EXISTS rating_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tea_base VARCHAR(50) NOT NULL COMMENT '茶底',
    toppings VARCHAR(500) NOT NULL COMMENT '小料组合（JSON数组格式）',
    predicted_rating DECIMAL(3,1) NOT NULL COMMENT '预测评分',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP
) COMMENT='预测记录历史表';

-- 用户反馈表（核心：存储实际评分，用于学习权重）
CREATE TABLE IF NOT EXISTS rating_feedback (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tea_base VARCHAR(50) NOT NULL COMMENT '茶底',
    toppings VARCHAR(500) NOT NULL COMMENT '小料组合（JSON数组格式）',
    combo_key VARCHAR(200) NOT NULL COMMENT '组合键（用于快速检索）',
    predicted_rating DECIMAL(3,1) NOT NULL COMMENT '系统预测评分',
    actual_rating INT NOT NULL COMMENT '用户实际评分（1-10）',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_combo_key (combo_key),
    INDEX idx_tea_base (tea_base)
) COMMENT='用户评分反馈表';

-- 组合学习权重表（从反馈中学习的权重，缓存加速预测）
CREATE TABLE IF NOT EXISTS combo_weight (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    combo_key VARCHAR(200) NOT NULL UNIQUE COMMENT '组合键',
    tea_base VARCHAR(50) NOT NULL,
    toppings VARCHAR(500) NOT NULL,
    avg_rating DECIMAL(3,1) NOT NULL COMMENT '平均实际评分',
    feedback_count INT NOT NULL DEFAULT 1 COMMENT '反馈次数',
    weight DECIMAL(5,4) NOT NULL DEFAULT 1.0 COMMENT '学习权重',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_combo_key (combo_key),
    INDEX idx_avg_rating (avg_rating)
) COMMENT='组合学习权重表';

-- 初始化一些模拟反馈数据（让系统一开始就有学习基础）
INSERT INTO rating_feedback (tea_base, toppings, combo_key, predicted_rating, actual_rating) VALUES 
('红茶', '["珍珠"]', '红茶:珍珠', 9.2, 9),
('红茶', '["珍珠"]', '红茶:珍珠', 9.2, 10),
('红茶', '["珍珠"]', '红茶:珍珠', 9.2, 9),
('红茶', '["仙草","珍珠"]', '红茶:珍珠,仙草', 9.5, 10),
('红茶', '["仙草","珍珠"]', '红茶:珍珠,仙草', 9.5, 9),
('红茶', '["仙草","珍珠"]', '红茶:珍珠,仙草', 9.5, 10),
('红茶', '["仙草","珍珠"]', '红茶:珍珠,仙草', 9.5, 10),
('红茶', '["布丁","珍珠"]', '红茶:珍珠,布丁', 9.3, 9),
('红茶', '["布丁","珍珠"]', '红茶:珍珠,布丁', 9.3, 8),
('乌龙', '["布丁","珍珠"]', '乌龙:珍珠,布丁', 9.5, 10),
('乌龙', '["布丁","珍珠"]', '乌龙:珍珠,布丁', 9.5, 9),
('绿茶', '["椰果","爆珠"]', '绿茶:椰果,爆珠', 9.0, 9),
('绿茶', '["椰果","爆珠"]', '绿茶:椰果,爆珠', 9.0, 8);

-- 初始化组合权重表（从模拟反馈中预计算）
INSERT INTO combo_weight (combo_key, tea_base, toppings, avg_rating, feedback_count, weight) VALUES 
('红茶:珍珠', '红茶', '["珍珠"]', 9.3, 3, 1.0),
('红茶:珍珠,仙草', '红茶', '["仙草","珍珠"]', 9.8, 4, 1.2),
('红茶:珍珠,布丁', '红茶', '["布丁","珍珠"]', 8.5, 2, 0.9),
('乌龙:珍珠,布丁', '乌龙', '["布丁","珍珠"]', 9.5, 2, 1.0),
('绿茶:椰果,爆珠', '绿茶', '["椰果","爆珠"]', 8.5, 2, 0.9);

-- 初始化茶底数据
INSERT INTO tea_base (name, description) VALUES 
('红茶', '经典红茶，浓郁香醇'),
('绿茶', '清新绿茶，爽口甘甜'),
('乌龙', '醇厚乌龙，香气持久');

-- 初始化小料数据
INSERT INTO topping (name, description) VALUES 
('珍珠', 'Q弹珍珠，嚼劲十足'),
('椰果', '清爽椰果，口感脆嫩'),
('仙草', '嫩滑仙草，清凉降火'),
('布丁', '香滑布丁，口感绵密'),
('爆珠', '果香爆珠，一口惊喜');
