-- 创建数据库
CREATE DATABASE IF NOT EXISTS woodjoin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE woodjoin;

-- 收藏表 (JPA会自动创建，这里只是参考结构)
CREATE TABLE IF NOT EXISTS favorites (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    join_type VARCHAR(50) NOT NULL,
    wood_length DOUBLE NOT NULL,
    wood_width DOUBLE NOT NULL,
    wood_height DOUBLE NOT NULL,
    tenon_length DOUBLE NOT NULL,
    tenon_width DOUBLE NOT NULL,
    tenon_height DOUBLE NOT NULL,
    margin DOUBLE NOT NULL,
    description VARCHAR(500),
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_join_type (join_type),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入示例数据
INSERT INTO favorites (name, join_type, wood_length, wood_width, wood_height, tenon_length, tenon_width, tenon_height, margin, description) VALUES
('标准燕尾榫', 'DOVETAIL', 200, 100, 30, 30, 20, 20, 5, '常用于抽屉、柜子等家具连接'),
('常用直榫', 'STRAIGHT', 300, 80, 40, 40, 30, 25, 3, '适合框架结构连接'),
('柜门板框榫', 'BOX', 250, 120, 25, 25, 15, 15, 4, '门框窗框拼接'),
('横梁搭接榫', 'LAP', 400, 100, 50, 60, 80, 25, 5, '梁架结构常用'),
('家具夹头榫', 'CLAMP', 350, 90, 45, 45, 35, 30, 3, '传统家具桌腿连接');

SELECT '数据库初始化完成！' AS message;