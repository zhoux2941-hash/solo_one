-- 创建数据库
CREATE DATABASE IF NOT EXISTS dubbing_system DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE dubbing_system;

-- 用户表
CREATE TABLE IF NOT EXISTS `user` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '用户名',
  `password` VARCHAR(100) NOT NULL COMMENT '密码（MD5加密）',
  `nickname` VARCHAR(50) NOT NULL COMMENT '昵称',
  `role` TINYINT(1) NOT NULL COMMENT '角色：1-甲方，2-配音员',
  `balance` DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '账户余额（积分）',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '个人简介',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除：0-否，1-是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 任务表
CREATE TABLE IF NOT EXISTS `task` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '任务ID',
  `publisher_id` BIGINT(20) NOT NULL COMMENT '发布者ID',
  `title` VARCHAR(100) NOT NULL COMMENT '任务标题',
  `content` VARCHAR(500) NOT NULL COMMENT '配音内容（200字以内）',
  `duration` VARCHAR(50) NOT NULL COMMENT '时长要求',
  `budget` DECIMAL(12, 2) NOT NULL COMMENT '预算（积分）',
  `example_audio` VARCHAR(255) DEFAULT NULL COMMENT '示例音频文件名',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：1-招募中，2-已结束',
  `winner_id` BIGINT(20) DEFAULT NULL COMMENT '中标者ID',
  `audition_count` INT(11) NOT NULL DEFAULT 0 COMMENT '试音人数',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除：0-否，1-是',
  PRIMARY KEY (`id`),
  KEY `idx_publisher_id` (`publisher_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务表';

-- 试音表
CREATE TABLE IF NOT EXISTS `audition` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '试音ID',
  `task_id` BIGINT(20) NOT NULL COMMENT '任务ID',
  `voice_actor_id` BIGINT(20) NOT NULL COMMENT '配音员ID',
  `audio_path` VARCHAR(255) NOT NULL COMMENT '试音音频文件名',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '附言',
  `status` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '状态：0-待审核，1-已中标，2-未中标',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除：0-否，1-是',
  PRIMARY KEY (`id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_voice_actor_id` (`voice_actor_id`),
  UNIQUE KEY `uk_task_actor` (`task_id`, `voice_actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='试音表';

-- 交易记录表
CREATE TABLE IF NOT EXISTS `transaction` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `type` TINYINT(1) NOT NULL COMMENT '类型：1-收入，2-支出，3-提现',
  `amount` DECIMAL(12, 2) NOT NULL COMMENT '金额（积分）',
  `balance` DECIMAL(12, 2) NOT NULL COMMENT '交易后余额',
  `description` VARCHAR(255) NOT NULL COMMENT '描述',
  `related_task_id` BIGINT(20) DEFAULT NULL COMMENT '关联任务ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-处理中，1-已完成',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='交易记录表';

-- 消息表
CREATE TABLE IF NOT EXISTS `message` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '接收用户ID',
  `title` VARCHAR(100) NOT NULL COMMENT '消息标题',
  `content` VARCHAR(500) NOT NULL COMMENT '消息内容',
  `type` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '类型：1-中标通知，2-未中标通知，0-系统消息',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否已读：0-未读，1-已读',
  `related_task_id` BIGINT(20) DEFAULT NULL COMMENT '关联任务ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除：0-否，1-是',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- 声线标签表
CREATE TABLE IF NOT EXISTS `voice_tag` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT '标签ID',
  `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除：0-否，1-是',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='声线标签表';

-- 配音员标签关联表
CREATE TABLE IF NOT EXISTS `user_tag` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '用户ID',
  `tag_id` BIGINT(20) NOT NULL COMMENT '标签ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_tag` (`user_id`, `tag_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='配音员标签关联表';

-- 任务标签关联表
CREATE TABLE IF NOT EXISTS `task_tag` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `task_id` BIGINT(20) NOT NULL COMMENT '任务ID',
  `tag_id` BIGINT(20) NOT NULL COMMENT '标签ID',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_task_tag` (`task_id`, `tag_id`),
  KEY `idx_task_id` (`task_id`),
  KEY `idx_tag_id` (`tag_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='任务标签关联表';

-- 作品集表
CREATE TABLE IF NOT EXISTS `portfolio` (
  `id` BIGINT(20) NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` BIGINT(20) NOT NULL COMMENT '配音员ID',
  `title` VARCHAR(100) NOT NULL COMMENT '作品标题',
  `audio_path` VARCHAR(255) NOT NULL COMMENT '音频文件名',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '作品描述',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否删除：0-否，1-是',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='作品集表';

-- 插入测试数据
-- 甲方用户（密码：123456，MD5加密后：e10adc3949ba59abbe56e057f20f883e）
INSERT INTO `user` (`username`, `password`, `nickname`, `role`, `balance`) VALUES
('publisher1', 'e10adc3949ba59abbe56e057f20f883e', '影视公司A', 1, 10000.00),
('publisher2', 'e10adc3949ba59abbe56e057f20f883e', '游戏工作室B', 1, 5000.00);

-- 配音员用户
INSERT INTO `user` (`username`, `password`, `nickname`, `role`, `balance`) VALUES
('voice1', 'e10adc3949ba59abbe56e057f20f883e', '声优小明', 2, 0.00),
('voice2', 'e10adc3949ba59abbe56e057f20f883e', '配音达人', 2, 0.00),
('voice3', 'e10adc3949ba59abbe56e057f20f883e', '专业配音员', 2, 0.00);

-- 示例任务
INSERT INTO `task` (`publisher_id`, `title`, `content`, `duration`, `budget`, `status`, `audition_count`) VALUES
(1, '企业宣传片配音', '欢迎来到我们公司，这里是梦想开始的地方...', '60秒内', 500.00, 1, 3),
(1, '产品广告配音', '全新升级，品质保证，现在购买享受8折优惠！', '30秒内', 300.00, 1, 5),
(2, '游戏角色配音', '勇者，你终于来了！这个世界需要你的拯救...', '1-2分钟', 800.00, 1, 2),
(2, '有声书录制', '第一章：命运的开始。在一个风和日丽的早晨...', '10分钟', 2000.00, 1, 4);

-- 示例试音
INSERT INTO `audition` (`task_id`, `voice_actor_id`, `audio_path`, `remark`, `status`) VALUES
(1, 3, 'demo1.mp3', '我有丰富的企业宣传片配音经验，希望能和您合作！', 0),
(1, 4, 'demo2.mp3', '声音沉稳大气，适合企业宣传风格。', 0),
(1, 5, 'demo3.mp3', '提供免费试音，满意再付款。', 0);

-- 声线标签
INSERT INTO `voice_tag` (`name`, `sort_order`) VALUES
('大叔音', 1),
('御姐音', 2),
('正太音', 3),
('萝莉音', 4),
('老年音', 5),
('少年音', 6),
('少女音', 7),
('中性音', 8),
('磁性低音', 9),
('甜美音', 10);

-- 配音员标签示例
INSERT INTO `user_tag` (`user_id`, `tag_id`) VALUES
(3, 1),
(3, 9),
(4, 2),
(4, 7),
(5, 3),
(5, 6);

-- 任务标签示例
INSERT INTO `task_tag` (`task_id`, `tag_id`) VALUES
(1, 1),
(1, 9),
(2, 2),
(3, 3),
(3, 6),
(4, 7);

-- 创建音频存储目录的SQL提示
-- 请确保 D:\dubbing-audio 目录存在（Windows）或 /dubbing-audio（Linux/Mac）
-- 或修改 application.yml 中的 app.audio.upload-path 配置
