-- 拼车模式数据库变更脚本

-- 1. 教练表增加是否接受拼车字段
ALTER TABLE `coach` ADD COLUMN `accept_carpool` TINYINT DEFAULT 1 COMMENT '是否接受拼车：1-接受，0-不接受' AFTER `rating_count`;

-- 2. 预约表增加拼车相关字段
ALTER TABLE `booking` ADD COLUMN `is_carpool` TINYINT DEFAULT 0 COMMENT '是否拼车：1-拼车，0-独自' AFTER `start_hour`;
ALTER TABLE `booking` ADD COLUMN `carpool_group_id` BIGINT DEFAULT NULL COMMENT '拼车组ID' AFTER `is_carpool`;
ALTER TABLE `booking` ADD COLUMN `carpool_role` VARCHAR(20) DEFAULT NULL COMMENT '拼车角色：INITIATOR-发起人，JOINER-加入者' AFTER `carpool_group_id`;

-- 3. 创建拼车组表
CREATE TABLE IF NOT EXISTS `carpool_group` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '拼车组ID',
    `coach_id` BIGINT NOT NULL COMMENT '教练ID',
    `slot_date` DATE NOT NULL COMMENT '日期',
    `start_hour` INT NOT NULL COMMENT '开始小时',
    `slot_id` BIGINT NOT NULL COMMENT '时段ID',
    `initiator_id` BIGINT NOT NULL COMMENT '发起人（学员ID）',
    `status` TINYINT DEFAULT 1 COMMENT '状态：1-等待拼友，2-拼车成功，3-拼车失败',
    `member_count` INT DEFAULT 1 COMMENT '成员数量',
    `create_time` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted` TINYINT DEFAULT 0 COMMENT '逻辑删除',
    PRIMARY KEY (`id`),
    KEY `idx_coach_id` (`coach_id`),
    KEY `idx_slot_date` (`slot_date`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='拼车组表';

-- 4. 新增时段状态：4-拼车中（已有一人，还可拼一人）
-- 时段状态说明：0-未设置，1-可预约，2-已预约，3-已锁定，4-拼车中

-- 更新测试数据：教练默认接受拼车
UPDATE `coach` SET `accept_carpool` = 1 WHERE `accept_carpool` IS NULL;