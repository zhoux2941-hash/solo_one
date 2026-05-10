-- 创建数据库
-- CREATE DATABASE IF NOT EXISTS pet_hospital DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
-- USE pet_hospital;

-- 插入疫苗类型数据
INSERT IGNORE INTO vaccines (id, name, description, manufacturer, created_at, updated_at) VALUES
(1, '狂犬疫苗', '预防狂犬病，适用于犬猫等多种动物', '默沙东', NOW(), NOW()),
(2, '猫三联疫苗', '预防猫瘟热、猫传染性鼻气管炎和猫杯状病毒感染', '硕腾', NOW(), NOW()),
(3, '犬四联疫苗', '预防犬瘟热、犬细小病毒病、犬传染性肝炎和犬副流感', '硕腾', NOW(), NOW()),
(4, '犬六联疫苗', '预防犬瘟热、犬细小病毒病、犬传染性肝炎、犬副流感、犬腺病毒II型和犬钩端螺旋体', '梅里亚', NOW(), NOW()),
(5, '猫五联疫苗', '预防猫瘟热、猫传染性鼻气管炎、猫杯状病毒感染、猫传染性腹膜炎和猫白血病', '勃林格殷格翰', NOW(), NOW()),
(6, '犬钩端螺旋体疫苗', '专门预防犬钩端螺旋体病', '维克', NOW(), NOW());

-- 插入疫苗批次数据（包含一些近效期批次用于演示）
-- 狂犬疫苗批次
INSERT IGNORE INTO vaccine_batches (id, vaccine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at) VALUES
(1, 1, 'RAB2024001', '2024-01-15', DATE_ADD(CURDATE(), INTERVAL 15 DAY), 50, NOW(), NOW()),
(2, 1, 'RAB2024002', '2024-03-20', DATE_ADD(CURDATE(), INTERVAL 45 DAY), 100, NOW(), NOW()),
(3, 1, 'RAB2024003', '2024-06-10', DATE_ADD(CURDATE(), INTERVAL 180 DAY), 200, NOW(), NOW());

-- 猫三联疫苗批次
INSERT IGNORE INTO vaccine_batches (id, vaccine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at) VALUES
(4, 2, 'FCV2024001', '2024-02-01', DATE_ADD(CURDATE(), INTERVAL 10 DAY), 30, NOW(), NOW()),
(5, 2, 'FCV2024002', '2024-04-15', DATE_ADD(CURDATE(), INTERVAL 60 DAY), 80, NOW(), NOW()),
(6, 2, 'FCV2024003', '2024-07-20', DATE_ADD(CURDATE(), INTERVAL 200 DAY), 150, NOW(), NOW());

-- 犬四联疫苗批次
INSERT IGNORE INTO vaccine_batches (id, vaccine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at) VALUES
(7, 3, 'DHPP2024001', '2024-01-20', DATE_ADD(CURDATE(), INTERVAL 25 DAY), 40, NOW(), NOW()),
(8, 3, 'DHPP2024002', '2024-05-10', DATE_ADD(CURDATE(), INTERVAL 90 DAY), 120, NOW(), NOW()),
(9, 3, 'DHPP2024003', '2024-08-05', DATE_ADD(CURDATE(), INTERVAL 220 DAY), 180, NOW(), NOW());

-- 犬六联疫苗批次
INSERT IGNORE INTO vaccine_batches (id, vaccine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at) VALUES
(10, 4, 'DHLPP2024001', '2024-03-01', DATE_ADD(CURDATE(), INTERVAL 5 DAY), 20, NOW(), NOW()),
(11, 4, 'DHLPP2024002', '2024-06-15', DATE_ADD(CURDATE(), INTERVAL 100 DAY), 90, NOW(), NOW()),
(12, 4, 'DHLPP2024003', '2024-09-01', DATE_ADD(CURDATE(), INTERVAL 250 DAY), 160, NOW(), NOW());

-- 猫五联疫苗批次
INSERT IGNORE INTO vaccine_batches (id, vaccine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at) VALUES
(13, 5, 'FVRCPF2024001', '2024-02-25', DATE_ADD(CURDATE(), INTERVAL 20 DAY), 35, NOW(), NOW()),
(14, 5, 'FVRCPF2024002', '2024-07-05', DATE_ADD(CURDATE(), INTERVAL 120 DAY), 100, NOW(), NOW()),
(15, 5, 'FVRCPF2024003', '2024-10-10', DATE_ADD(CURDATE(), INTERVAL 300 DAY), 200, NOW(), NOW());

-- 犬钩端螺旋体疫苗批次
INSERT IGNORE INTO vaccine_batches (id, vaccine_id, batch_number, production_date, expiry_date, quantity, created_at, updated_at) VALUES
(16, 6, 'LEPTO2024001', '2024-04-01', DATE_ADD(CURDATE(), INTERVAL 30 DAY), 60, NOW(), NOW()),
(17, 6, 'LEPTO2024002', '2024-08-15', DATE_ADD(CURDATE(), INTERVAL 150 DAY), 140, NOW(), NOW()),
(18, 6, 'LEPTO2024003', '2024-11-20', DATE_ADD(CURDATE(), INTERVAL 365 DAY), 250, NOW(), NOW());
