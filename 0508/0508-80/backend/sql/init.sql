-- 创建数据库
CREATE DATABASE IF NOT EXISTS festival_volunteer DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE festival_volunteer;

-- 岗位类型枚举
-- TICKET_CHECKING, GUIDE, STAGE_ASSIST, LOGISTICS, SECURITY, FIRST_AID, OTHER

-- 岗位状态枚举
-- ACTIVE, FULL, INACTIVE

-- 用户角色枚举
-- VOLUNTEER, LEADER, ADMIN

-- 申请状态枚举
-- PENDING, APPROVED, REJECTED, ASSIGNED

-- 排班状态枚举
-- PENDING, CHECKED_IN, COMPLETED, CANCELLED

-- 签到方式枚举
-- CODE, GPS, MANUAL

-- 通知类型枚举
-- SCHEDULE_ASSIGNED, APPROVAL, REJECTION, CHECK_IN_REMINDER, SYSTEM

-- 插入初始岗位数据
INSERT INTO positions (name, description, type, required_count, current_count, location, status, created_at, updated_at) VALUES
('检票口A检票', '负责主入口检票工作', 'TICKET_CHECKING', 10, 0, '音乐节主入口A区', 'ACTIVE', NOW(), NOW()),
('检票口B检票', '负责次入口检票工作', 'TICKET_CHECKING', 8, 0, '音乐节主入口B区', 'ACTIVE', NOW(), NOW()),
('主舞台引导', '引导观众前往主舞台区域', 'GUIDE', 6, 0, '主舞台周边', 'ACTIVE', NOW(), NOW()),
('VIP区引导', '引导VIP观众到指定区域', 'GUIDE', 4, 0, 'VIP区入口', 'ACTIVE', NOW(), NOW()),
('舞台设备协助', '协助舞台设备搭建和调试', 'STAGE_ASSIST', 5, 0, '主舞台后台', 'ACTIVE', NOW(), NOW()),
('艺人接待', '负责艺人接待和行程安排', 'STAGE_ASSIST', 3, 0, '艺人休息区', 'ACTIVE', NOW(), NOW()),
('物资运输', '负责物资运输和分发', 'LOGISTICS', 8, 0, '后勤仓库', 'ACTIVE', NOW(), NOW()),
('医疗站协助', '协助医疗站工作', 'FIRST_AID', 4, 0, '医疗站', 'ACTIVE', NOW(), NOW()),
('外围安保', '负责外围安全巡逻', 'SECURITY', 12, 0, '场地外围', 'ACTIVE', NOW(), NOW()),
('内场安保', '负责内场秩序维护', 'SECURITY', 10, 0, '内场区域', 'ACTIVE', NOW(), NOW());
