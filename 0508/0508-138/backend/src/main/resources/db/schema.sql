-- 矿物鉴定辅助工具数据库结构
-- 数据库: mineral_identification

CREATE DATABASE IF NOT EXISTS mineral_identification DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE mineral_identification;

-- 矿物表
CREATE TABLE IF NOT EXISTS minerals (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    name_cn VARCHAR(100) NOT NULL,
    chemical_formula VARCHAR(200),
    typical_location VARCHAR(500),
    image_url VARCHAR(500),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 矿物特征表（多对多关系）
CREATE TABLE IF NOT EXISTS mineral_features (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    mineral_id BIGINT NOT NULL,
    feature_type VARCHAR(50) NOT NULL,
    feature_value VARCHAR(200) NOT NULL,
    weight DECIMAL(5,4) DEFAULT 1.0000,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (mineral_id) REFERENCES minerals(id) ON DELETE CASCADE,
    INDEX idx_feature_type_value (feature_type, feature_value)
);

-- 鉴定记录表（用于众包数据修正）
CREATE TABLE IF NOT EXISTS identification_records (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    input_hardness DECIMAL(3,1),
    input_streak VARCHAR(50),
    input_luster VARCHAR(50),
    input_cleavage VARCHAR(50),
    confirmed_mineral_id BIGINT,
    ip_address VARCHAR(50),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (confirmed_mineral_id) REFERENCES minerals(id) ON DELETE SET NULL
);

-- 特征枚举值
-- 摩氏硬度: 1-10
-- 条痕色: white, gray, reddish_brown, black, yellow, green, blue, colorless, brown
-- 光泽: metallic, glassy, greasy, pearly, dull, earthy, silky, adamantine
-- 解理: perfect, good, distinct, indistinct, absent, basal, prismatic, cubic, octahedral
