-- 数据库初始化脚本
-- 插入示例饮水机数据

INSERT IGNORE INTO water_machines (machine_id, floor, location, created_at, updated_at) VALUES
(1, 1, '前台大厅', NOW(), NOW()),
(2, 1, '东侧会议室旁', NOW(), NOW()),
(3, 2, '研发部办公区', NOW(), NOW()),
(4, 2, '西侧茶水间', NOW(), NOW()),
(5, 3, '市场部区域', NOW(), NOW()),
(6, 3, '总经理办公室旁', NOW(), NOW()),
(7, 4, '财务部工作区', NOW(), NOW()),
(8, 4, '大会议室门口', NOW(), NOW());
