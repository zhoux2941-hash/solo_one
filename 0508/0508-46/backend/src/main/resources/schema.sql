CREATE DATABASE IF NOT EXISTS slide_simulator
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE slide_simulator;

CREATE TABLE IF NOT EXISTS simulation_summary (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  simulation_id VARCHAR(20) NOT NULL UNIQUE,
  total_children INT NOT NULL,
  patience_coefficient INT NOT NULL,
  slide_usage_time INT NOT NULL,
  total_simulation_time INT NOT NULL,
  children_who_left_early INT NOT NULL,
  total_plays INT NOT NULL,
  average_wait_time INT NOT NULL,
  simulation_time DATETIME NOT NULL,
  INDEX idx_simulation_time (simulation_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
