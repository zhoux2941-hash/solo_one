CREATE DATABASE IF NOT EXISTS carwash_monitor
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE carwash_monitor;

CREATE TABLE IF NOT EXISTS foam_concentration (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  machine_id VARCHAR(10) NOT NULL,
  concentration DOUBLE NOT NULL,
  record_time DATETIME NOT NULL,
  INDEX idx_machine_time (machine_id, record_time),
  INDEX idx_record_time (record_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
