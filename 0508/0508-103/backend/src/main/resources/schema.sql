CREATE DATABASE IF NOT EXISTS trash_bin DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE trash_bin;

DROP TABLE IF EXISTS exchange_order;
DROP TABLE IF EXISTS garbage_record;
DROP TABLE IF EXISTS product;
DROP TABLE IF EXISTS resident;

CREATE TABLE resident (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '居民ID',
    room_number VARCHAR(50) NOT NULL COMMENT '房号',
    name VARCHAR(100) NOT NULL COMMENT '姓名',
    points INT DEFAULT 0 COMMENT '积分',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_room_number (room_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='居民表';

CREATE TABLE product (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '商品ID',
    name VARCHAR(100) NOT NULL COMMENT '商品名称',
    points_required INT NOT NULL COMMENT '所需积分',
    stock INT DEFAULT 0 COMMENT '库存',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

CREATE TABLE garbage_record (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
    resident_id BIGINT NOT NULL COMMENT '居民ID',
    garbage_type VARCHAR(20) NOT NULL COMMENT '垃圾类型',
    weight DECIMAL(10, 2) NOT NULL COMMENT '重量(kg)',
    points_earned INT DEFAULT 0 COMMENT '获得积分',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    KEY idx_resident_id (resident_id),
    KEY idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='垃圾投递记录表';

CREATE TABLE exchange_order (
    id BIGINT PRIMARY KEY AUTO_INCREMENT COMMENT '订单ID',
    order_no VARCHAR(32) NOT NULL COMMENT '订单编号',
    resident_id BIGINT NOT NULL COMMENT '居民ID',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    product_name VARCHAR(100) COMMENT '商品名称',
    quantity INT DEFAULT 1 COMMENT '数量',
    points_consumed INT NOT NULL COMMENT '消耗积分',
    status VARCHAR(20) DEFAULT '待核销' COMMENT '状态:待核销/已核销/已取消',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    verify_time DATETIME COMMENT '核销时间',
    deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    UNIQUE KEY uk_order_no (order_no),
    KEY idx_resident_id (resident_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='兑换订单表';

INSERT INTO product (name, points_required, stock) VALUES 
('洗衣液', 50, 100),
('洗洁精', 30, 150),
('卫生纸', 20, 200),
('牙膏', 40, 100),
('香皂', 25, 150);
