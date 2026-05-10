-- 创建数据库
CREATE DATABASE IF NOT EXISTS bus_scheduling DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE bus_scheduling;

-- 司机表（JPA自动创建，这里提供参考）
-- CREATE TABLE IF NOT EXISTS drivers (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     name VARCHAR(100) NOT NULL,
--     driver_number VARCHAR(50) NOT NULL UNIQUE,
--     phone VARCHAR(20),
--     initial_energy INT DEFAULT 100,
--     created_at DATETIME NOT NULL,
--     updated_at DATETIME NOT NULL
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 排班表（JPA自动创建，这里提供参考）
-- CREATE TABLE IF NOT EXISTS schedules (
--     id BIGINT AUTO_INCREMENT PRIMARY KEY,
--     driver_id BIGINT NOT NULL,
--     schedule_date DATE NOT NULL,
--     time_slot_start TIME NOT NULL,
--     time_slot_end TIME NOT NULL,
--     energy_before INT NOT NULL,
--     energy_after INT NOT NULL,
--     type VARCHAR(20) NOT NULL,
--     remark VARCHAR(255),
--     created_at DATETIME NOT NULL,
--     FOREIGN KEY (driver_id) REFERENCES drivers(id),
--     UNIQUE KEY uk_driver_time (driver_id, schedule_date, time_slot_start, time_slot_end)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
