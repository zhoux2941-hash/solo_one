-- 超时预警功能数据库更新脚本
-- 执行日期: 2024-05-10

USE construction_progress;

-- ============================================
-- 1. 为工序表添加计划天数字段
-- ============================================
ALTER TABLE project_stages 
ADD COLUMN IF NOT EXISTS planned_days INT DEFAULT 0 COMMENT '计划完成天数';

ALTER TABLE project_stages 
ADD COLUMN IF NOT EXISTS start_time DATETIME NULL COMMENT '工序开始时间';

ALTER TABLE project_stages 
ADD COLUMN IF NOT EXISTS last_warning_time DATETIME NULL COMMENT '上次预警时间';

-- ============================================
-- 2. 创建站内信/消息通知表
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL COMMENT '关联项目ID',
    stage_index INT COMMENT '关联工序索引',
    stage_name VARCHAR(50) COMMENT '工序名称',
    user_id BIGINT NOT NULL COMMENT '接收用户ID',
    title VARCHAR(200) NOT NULL COMMENT '消息标题',
    content TEXT COMMENT '消息内容',
    type ENUM('WARNING', 'INFO', 'URGE_REPLY') DEFAULT 'WARNING' COMMENT '消息类型',
    is_read TINYINT(1) DEFAULT 0 COMMENT '是否已读',
    related_stage_progress DECIMAL(5,2) COMMENT '预警时的进度',
    overdue_days INT COMMENT '逾期天数',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_is_read (is_read),
    INDEX idx_create_time (create_time),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站内消息通知表';

-- ============================================
-- 3. 为现有数据设置默认值
-- ============================================
-- 设置默认计划天数（地基7天，框架14天，砌墙10天，封顶5天，装修20天）
UPDATE project_stages SET planned_days = 7 WHERE stage_index = 0 AND (planned_days IS NULL OR planned_days = 0);
UPDATE project_stages SET planned_days = 14 WHERE stage_index = 1 AND (planned_days IS NULL OR planned_days = 0);
UPDATE project_stages SET planned_days = 10 WHERE stage_index = 2 AND (planned_days IS NULL OR planned_days = 0);
UPDATE project_stages SET planned_days = 5 WHERE stage_index = 3 AND (planned_days IS NULL OR planned_days = 0);
UPDATE project_stages SET planned_days = 20 WHERE stage_index = 4 AND (planned_days IS NULL OR planned_days = 0);

-- 设置当前工序的开始时间为项目创建时间
UPDATE project_stages ps 
JOIN projects p ON ps.project_id = p.id 
SET ps.start_time = p.create_time 
WHERE ps.stage_index = p.current_stage 
AND ps.start_time IS NULL
AND ps.is_completed = 0;

-- 设置已完成工序的开始时间
UPDATE project_stages ps 
JOIN projects p ON ps.project_id = p.id 
SET ps.start_time = p.create_time 
WHERE ps.stage_index < p.current_stage 
AND ps.start_time IS NULL;
