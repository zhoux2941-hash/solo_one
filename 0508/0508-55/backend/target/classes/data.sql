-- 鲜花保鲜剂配方对比工具 - 数据初始化脚本
-- 请在MySQL中执行此脚本

CREATE DATABASE IF NOT EXISTS flower_preservative CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flower_preservative;

-- 配方表
CREATE TABLE IF NOT EXISTS formulas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    formula_code VARCHAR(50) NOT NULL UNIQUE,
    formula_name VARCHAR(100),
    description VARCHAR(500),
    fresh_days INT,
    cost INT,
    ease_of_use INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 鲜花类型表
CREATE TABLE IF NOT EXISTS flowers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flower_type VARCHAR(100) NOT NULL UNIQUE,
    recommended_formula VARCHAR(50),
    base_lifespan_days INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 鲜花-配方映射表
CREATE TABLE IF NOT EXISTS flower_formula_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    flower_type VARCHAR(100) NOT NULL,
    formula_code VARCHAR(50) NOT NULL,
    lifespan_extension_days INT,
    is_recommended BOOLEAN DEFAULT FALSE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 清空表（防止重复插入）
TRUNCATE TABLE flower_formula_mappings;
TRUNCATE TABLE flowers;
TRUNCATE TABLE formulas;

-- 插入三种配方
INSERT INTO formulas (formula_code, formula_name, description, fresh_days, cost, ease_of_use) VALUES
('A', '营养型配方', '富含糖分和微量元素，提供充足营养，延长花期显著', 14, 3, 4),
('B', '抗菌型配方', '添加抑菌成分，有效防止水质恶化和细菌滋生', 12, 4, 5),
('C', '平衡型配方', '营养与抑菌平衡，性价比高，适合大多数鲜花', 10, 2, 3);

-- 插入鲜花类型
INSERT INTO flowers (flower_type, recommended_formula, base_lifespan_days) VALUES
('通用', 'C', 5),
('玫瑰', 'B', 7),
('百合', 'A', 10),
('康乃馨', 'C', 14),
('菊花', 'C', 12),
('郁金香', 'B', 8),
('向日葵', 'A', 10),
('满天星', 'C', 20),
('洋桔梗', 'B', 10);

-- 插入鲜花-配方映射
-- 玫瑰 - 推荐配方B
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('玫瑰', 'A', 9, FALSE),
('玫瑰', 'B', 15, TRUE),
('玫瑰', 'C', 11, FALSE);

-- 百合 - 推荐配方A
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('百合', 'A', 18, TRUE),
('百合', 'B', 14, FALSE),
('百合', 'C', 13, FALSE);

-- 康乃馨 - 推荐配方C
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('康乃馨', 'A', 17, FALSE),
('康乃馨', 'B', 15, FALSE),
('康乃馨', 'C', 20, TRUE);

-- 菊花 - 推荐配方C
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('菊花', 'A', 15, FALSE),
('菊花', 'B', 13, FALSE),
('菊花', 'C', 18, TRUE);

-- 郁金香 - 推荐配方B
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('郁金香', 'A', 10, FALSE),
('郁金香', 'B', 14, TRUE),
('郁金香', 'C', 9, FALSE);

-- 向日葵 - 推荐配方A
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('向日葵', 'A', 16, TRUE),
('向日葵', 'B', 12, FALSE),
('向日葵', 'C', 11, FALSE);

-- 满天星 - 推荐配方C
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('满天星', 'A', 22, FALSE),
('满天星', 'B', 20, FALSE),
('满天星', 'C', 28, TRUE);

-- 洋桔梗 - 推荐配方B
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('洋桔梗', 'A', 12, FALSE),
('洋桔梗', 'B', 17, TRUE),
('洋桔梗', 'C', 11, FALSE);

-- 通用 - 推荐配方C
INSERT INTO flower_formula_mappings (flower_type, formula_code, lifespan_extension_days, is_recommended) VALUES
('通用', 'A', 10, FALSE),
('通用', 'B', 11, FALSE),
('通用', 'C', 12, TRUE);

-- 自定义配方表（用于用户自定义的配方D）
CREATE TABLE IF NOT EXISTS custom_formulas (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64),
    formula_code VARCHAR(50) NOT NULL,
    formula_name VARCHAR(100),
    sugar_ratio DOUBLE,
    bleach_ratio DOUBLE,
    citric_acid_ratio DOUBLE,
    other_ingredients VARCHAR(500),
    fresh_days INT,
    cost INT,
    ease_of_use INT,
    description VARCHAR(500),
    is_logged_in BOOLEAN DEFAULT FALSE,
    user_id BIGINT,
    created_at DATETIME,
    expires_at DATETIME,
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 实验记录表
CREATE TABLE IF NOT EXISTS experiment_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(64),
    flower_type VARCHAR(100) NOT NULL,
    experiment_days INT NOT NULL,
    formula_a_result DOUBLE,
    formula_a_status VARCHAR(50),
    formula_b_result DOUBLE,
    formula_b_status VARCHAR(50),
    formula_c_result DOUBLE,
    formula_c_status VARCHAR(50),
    formula_d_result DOUBLE,
    formula_d_status VARCHAR(50),
    formula_d_exists BOOLEAN DEFAULT FALSE,
    formula_d_name VARCHAR(100),
    recommended_formula VARCHAR(50),
    is_logged_in BOOLEAN DEFAULT FALSE,
    user_id BIGINT,
    created_at DATETIME,
    expires_at DATETIME,
    note VARCHAR(500),
    INDEX idx_session_id (session_id),
    INDEX idx_user_id (user_id),
    INDEX idx_flower_type (flower_type),
    INDEX idx_expires_at (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SELECT '数据初始化完成！' AS message;
