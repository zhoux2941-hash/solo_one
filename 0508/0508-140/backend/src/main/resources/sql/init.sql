CREATE DATABASE IF NOT EXISTS pottery_simulator DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pottery_simulator;

CREATE TABLE IF NOT EXISTS classic_pottery (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL COMMENT '器型名称',
    type VARCHAR(50) NOT NULL COMMENT '器型类型：盏、碗、瓶等',
    description VARCHAR(500) COMMENT '器型描述',
    profile_points TEXT NOT NULL COMMENT '轮廓点数据，JSON格式存储',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经典器型表';

CREATE TABLE IF NOT EXISTS user_pottery (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT COMMENT '用户ID，可空支持匿名',
    name VARCHAR(100) NOT NULL COMMENT '器型名称',
    profile_points TEXT NOT NULL COMMENT '轮廓点数据，JSON格式存储',
    rotation_segments INT DEFAULT 64 COMMENT '旋转面数',
    smoothness DOUBLE DEFAULT 0.5 COMMENT '平滑度',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户创作器型表';

CREATE TABLE IF NOT EXISTS share_link (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    share_code VARCHAR(32) NOT NULL UNIQUE COMMENT '分享码',
    pottery_id BIGINT NOT NULL COMMENT '关联的器型ID',
    pottery_type VARCHAR(20) NOT NULL COMMENT '器型类型：classic/user',
    expiry_time TIMESTAMP COMMENT '过期时间，NULL表示永久',
    view_count INT DEFAULT 0 COMMENT '查看次数',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_share_code (share_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='分享链接表';

INSERT INTO classic_pottery (name, type, description, profile_points) VALUES
('仿宋建盏', '盏', '宋代经典茶盏器型', '[
    {"x": 0, "y": 0},
    {"x": 15, "y": 0},
    {"x": 18, "y": 5},
    {"x": 20, "y": 10},
    {"x": 22, "y": 20},
    {"x": 23, "y": 30},
    {"x": 22, "y": 40},
    {"x": 18, "y": 50},
    {"x": 10, "y": 55},
    {"x": 8, "y": 60},
    {"x": 10, "y": 65}
]'),
('明永乐碗', '碗', '明代经典碗型', '[
    {"x": 0, "y": 0},
    {"x": 20, "y": 0},
    {"x": 25, "y": 8},
    {"x": 28, "y": 20},
    {"x": 30, "y": 35},
    {"x": 28, "y": 50},
    {"x": 25, "y": 65},
    {"x": 20, "y": 80},
    {"x": 15, "y": 90},
    {"x": 10, "y": 95},
    {"x": 8, "y": 100}
]'),
('青花梅瓶', '瓶', '经典梅瓶器型', '[
    {"x": 0, "y": 0},
    {"x": 8, "y": 0},
    {"x": 10, "y": 10},
    {"x": 12, "y": 30},
    {"x": 18, "y": 60},
    {"x": 25, "y": 100},
    {"x": 28, "y": 140},
    {"x": 26, "y": 180},
    {"x": 22, "y": 220},
    {"x": 15, "y": 250},
    {"x": 12, "y": 270},
    {"x": 10, "y": 280}
]');
