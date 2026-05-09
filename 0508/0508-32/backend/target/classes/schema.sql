CREATE DATABASE IF NOT EXISTS kindergarten_material DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kindergarten_material;

CREATE TABLE IF NOT EXISTS material_consumption (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    material_type VARCHAR(50) NOT NULL,
    consumption_date DATE NOT NULL,
    amount DOUBLE NOT NULL,
    unit VARCHAR(20) NOT NULL,
    INDEX idx_date (consumption_date),
    INDEX idx_material (material_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
