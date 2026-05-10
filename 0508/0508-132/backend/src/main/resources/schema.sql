CREATE DATABASE IF NOT EXISTS pipette_optimizer CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pipette_optimizer;

CREATE TABLE IF NOT EXISTS tube_rack (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    rows INT NOT NULL,
    columns INT NOT NULL,
    created_at DATETIME,
    updated_at DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS well_position (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tube_rack_id BIGINT NOT NULL,
    row_num INT NOT NULL,
    col_num INT NOT NULL,
    reagent_type VARCHAR(50) NOT NULL DEFAULT 'EMPTY',
    label VARCHAR(50),
    notes VARCHAR(500),
    created_at DATETIME,
    updated_at DATETIME,
    UNIQUE KEY uk_tube_rack_position (tube_rack_id, row_num, col_num),
    INDEX idx_tube_rack_id (tube_rack_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS experiment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    tube_rack_id BIGINT NOT NULL,
    created_by VARCHAR(100),
    is_shared BOOLEAN DEFAULT FALSE,
    share_code VARCHAR(20) UNIQUE,
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_share_code (share_code),
    INDEX idx_is_shared (is_shared)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pipette_task (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    experiment_id BIGINT NOT NULL,
    source_well_id BIGINT NOT NULL,
    target_well_id BIGINT NOT NULL,
    volume_ul DOUBLE,
    task_order INT,
    notes VARCHAR(500),
    created_at DATETIME,
    updated_at DATETIME,
    INDEX idx_experiment_id (experiment_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;