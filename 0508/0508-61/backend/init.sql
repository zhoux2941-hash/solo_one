-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS express_station DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE express_station;

-- 包裹表（JPA 会自动创建，这里作为备用）
CREATE TABLE IF NOT EXISTS parcels (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    parcel_no VARCHAR(50) NOT NULL UNIQUE,
    length DOUBLE NOT NULL,
    width DOUBLE NOT NULL,
    height DOUBLE NOT NULL,
    volume_cm3 DOUBLE NOT NULL,
    volume_m3 DOUBLE NOT NULL,
    shelf_row INT,
    shelf_col INT,
    allocation_batch_id VARCHAR(255),
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    INDEX idx_parcel_no (parcel_no),
    INDEX idx_allocation_batch (allocation_batch_id),
    INDEX idx_shelf_location (shelf_row, shelf_col)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
