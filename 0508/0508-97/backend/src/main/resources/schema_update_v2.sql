-- 表情包大赛系统 V2 升级脚本

USE meme_contest;

-- 1. 为表情包表添加标签和PK相关字段
ALTER TABLE `meme` 
ADD COLUMN `tags` VARCHAR(500) DEFAULT NULL COMMENT '标签，多个标签用逗号分隔' AFTER `description`,
ADD COLUMN `pk_wins` INT NOT NULL DEFAULT 0 COMMENT 'PK胜利次数' AFTER `careless_score`,
ADD COLUMN `pk_losses` INT NOT NULL DEFAULT 0 COMMENT 'PK失败次数' AFTER `pk_wins`;

-- 2. 创建PK对战记录表
CREATE TABLE IF NOT EXISTS `pk_battle` (
    `id` BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT 'PK记录ID',
    `user_id` BIGINT NOT NULL COMMENT '参与用户ID',
    `meme1_id` BIGINT NOT NULL COMMENT '表情包1 ID',
    `meme2_id` BIGINT NOT NULL COMMENT '表情包2 ID',
    `winner_id` BIGINT NOT NULL COMMENT '获胜者ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_meme1_id` (`meme1_id`),
    INDEX `idx_meme2_id` (`meme2_id`),
    INDEX `idx_winner_id` (`winner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='PK对战记录表';

-- 3. 为已有的表情包设置一些默认标签（可选）
-- UPDATE `meme` SET tags = '搞笑' WHERE title LIKE '%搞笑%';
-- UPDATE `meme` SET tags = '打工人' WHERE title LIKE '%上班%' OR title LIKE '%工作%';
