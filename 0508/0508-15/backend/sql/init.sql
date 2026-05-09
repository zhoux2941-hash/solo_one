CREATE TABLE IF NOT EXISTS orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL UNIQUE,
    merchant_lng DOUBLE NOT NULL,
    merchant_lat DOUBLE NOT NULL,
    user_lng DOUBLE NOT NULL,
    user_lat DOUBLE NOT NULL,
    created_at DATETIME NOT NULL,
    expected_delivery_time DATETIME NOT NULL,
    actual_delivery_time DATETIME NULL,
    rider_id VARCHAR(50) NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rider_id (rider_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rider_tracks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rider_id VARCHAR(50) NOT NULL,
    order_id VARCHAR(50) NOT NULL,
    lng DOUBLE NOT NULL,
    lat DOUBLE NOT NULL,
    reported_at DATETIME NOT NULL,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_rider_id (rider_id),
    INDEX idx_order_id (order_id),
    INDEX idx_reported_at (reported_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS riders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rider_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'OFFLINE',
    current_lng DOUBLE,
    current_lat DOUBLE,
    current_order_id VARCHAR(50),
    total_orders INT DEFAULT 0,
    on_time_orders INT DEFAULT 0,
    created_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO riders (rider_id, name, phone, status) VALUES 
('R001', '张三', '13800138001', 'IDLE'),
('R002', '李四', '13800138002', 'IDLE'),
('R003', '王五', '13800138003', 'IDLE'),
('R004', '赵六', '13800138004', 'IDLE'),
('R005', '钱七', '13800138005', 'IDLE');

INSERT INTO orders (order_id, merchant_lng, merchant_lat, user_lng, user_lat, created_at, expected_delivery_time, rider_id, status) VALUES 
('ORD001', 116.397428, 39.90923, 116.407428, 39.91923, NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE), 'R001', 'DELIVERING'),
('ORD002', 116.407428, 39.91923, 116.417428, 39.92923, NOW(), DATE_ADD(NOW(), INTERVAL 25 MINUTE), 'R002', 'DELIVERING'),
('ORD003', 116.417428, 39.92923, 116.427428, 39.93923, NOW(), DATE_ADD(NOW(), INTERVAL 35 MINUTE), 'R003', 'DELIVERING'),
('ORD004', 116.427428, 39.93923, 116.437428, 39.94923, NOW(), DATE_ADD(NOW(), INTERVAL 20 MINUTE), 'R004', 'DELIVERING'),
('ORD005', 116.387428, 39.89923, 116.397428, 39.90923, NOW(), DATE_ADD(NOW(), INTERVAL 15 MINUTE), 'R005', 'DELIVERING');

INSERT INTO orders (order_id, merchant_lng, merchant_lat, user_lng, user_lat, created_at, expected_delivery_time, rider_id, status) VALUES 
('PEND001', 116.405, 39.915, 116.425, 39.935, NOW(), DATE_ADD(NOW(), INTERVAL 40 MINUTE), NULL, 'PENDING'),
('PEND002', 116.395, 39.905, 116.415, 39.925, NOW(), DATE_ADD(NOW(), INTERVAL 35 MINUTE), NULL, 'PENDING'),
('PEND003', 116.415, 39.925, 116.435, 39.945, NOW(), DATE_ADD(NOW(), INTERVAL 30 MINUTE), NULL, 'PENDING');
