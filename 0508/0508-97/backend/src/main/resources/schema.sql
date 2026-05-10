CREATE DATABASE IF NOT EXISTS meme_contest DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE meme_contest;

CREATE TABLE IF NOT EXISTS `user` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '用户ID',
    `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
    `password` VARCHAR(255) NOT NULL COMMENT '密码（加密）',
    `nickname` VARCHAR(50) COMMENT '昵称',
    `email` VARCHAR(100) COMMENT '邮箱',
    `avatar` VARCHAR(255) COMMENT '头像URL',
    `role` VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色：USER/ADMIN',
    `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：1-正常，0-禁用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_username` (`username`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

CREATE TABLE IF NOT EXISTS `meme` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '表情包ID',
    `user_id` BIGINT NOT NULL COMMENT '上传用户ID',
    `title` VARCHAR(100) NOT NULL COMMENT '标题',
    `description` VARCHAR(500) COMMENT '描述',
    `image_url` VARCHAR(255) NOT NULL COMMENT '图片URL',
    `status` VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '状态：PENDING/APPROVED/REJECTED',
    `vote_count` INT NOT NULL DEFAULT 0 COMMENT '投票数',
    `reviewer_id` BIGINT COMMENT '审核人ID',
    `review_comment` VARCHAR(500) COMMENT '审核备注',
    `reviewed_at` DATETIME COMMENT '审核时间',
    `magic_score` INT NOT NULL DEFAULT 0 COMMENT '魔性评分',
    `careless_score` INT NOT NULL DEFAULT 0 COMMENT '草率评分',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_vote_count` (`vote_count`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='表情包表';

CREATE TABLE IF NOT EXISTS `vote` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '投票ID',
    `user_id` BIGINT NOT NULL COMMENT '投票用户ID',
    `meme_id` BIGINT NOT NULL COMMENT '表情包ID',
    `vote_date` DATE NOT NULL COMMENT '投票日期',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY `uk_user_meme_date` (`user_id`, `meme_id`, `vote_date`),
    INDEX `idx_user_date` (`user_id`, `vote_date`),
    INDEX `idx_meme_id` (`meme_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投票表';

CREATE TABLE IF NOT EXISTS `comment` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '评论ID',
    `meme_id` BIGINT NOT NULL COMMENT '表情包ID',
    `user_id` BIGINT NOT NULL COMMENT '评论用户ID',
    `parent_id` BIGINT DEFAULT 0 COMMENT '父评论ID（0表示顶级评论）',
    `reply_to_id` BIGINT DEFAULT NULL COMMENT '回复的用户ID',
    `content` VARCHAR(500) NOT NULL COMMENT '评论内容',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
    INDEX `idx_meme_id` (`meme_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_parent_id` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='评论表';

INSERT INTO `user` (`username`, `password`, `nickname`, `role`)
VALUES ('admin', '$2a$10$N.zmdr9k7uOCQb376NoUnuTJ8iAt6Z5EHsM8lE9lBOsl7iAt6Z5EH', '管理员', 'ADMIN');
