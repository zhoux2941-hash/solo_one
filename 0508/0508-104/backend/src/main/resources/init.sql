CREATE DATABASE IF NOT EXISTS club_recruitment DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE club_recruitment;

INSERT INTO departments (name, max_capacity, interviewers_per_slot, available_slots, active, created_at, updated_at) VALUES
('技术部', 20, 3, '周一9-12,周一14-17,周二9-12,周二14-17,周三9-12,周三14-17', 1, NOW(), NOW()),
('宣传部', 15, 2, '周一9-12,周一19-21,周四14-17,周四19-21,周五14-17', 1, NOW(), NOW()),
('外联部', 15, 2, '周二19-21,周三9-12,周三19-21,周四9-12,周五9-12', 1, NOW(), NOW()),
('组织部', 20, 3, '周一14-17,周二9-12,周二19-21,周三14-17,周四9-12', 1, NOW(), NOW()),
('文艺部', 12, 2, '周四19-21,周五14-17,周五19-21,周六9-12,周六14-17', 1, NOW(), NOW());