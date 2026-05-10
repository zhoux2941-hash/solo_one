CREATE DATABASE IF NOT EXISTS opera_mask DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE opera_mask;

CREATE TABLE IF NOT EXISTS mask_template (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    type VARCHAR(50) DEFAULT 'default',
    svg_content TEXT,
    regions TEXT,
    preview_image TEXT,
    is_default TINYINT DEFAULT 0,
    create_by BIGINT,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_design (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100),
    template_id BIGINT,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    design_data TEXT,
    preview_image TEXT,
    svg_content TEXT,
    like_count INT DEFAULT 0,
    comment_count INT DEFAULT 0,
    is_public TINYINT DEFAULT 1,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_user_id (user_id),
    INDEX idx_template_id (template_id),
    INDEX idx_is_public (is_public)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS comment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    design_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    user_name VARCHAR(100),
    content TEXT NOT NULL,
    parent_id BIGINT DEFAULT 0,
    like_count INT DEFAULT 0,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted TINYINT DEFAULT 0,
    INDEX idx_design_id (design_id),
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user_favorite (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    design_id BIGINT NOT NULL,
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_user_design (user_id, design_id),
    INDEX idx_design_id (design_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
