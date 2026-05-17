CREATE TABLE IF NOT EXISTS sys_user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(100),
    role VARCHAR(50),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS project (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_name VARCHAR(100) NOT NULL UNIQUE,
    project_code VARCHAR(200),
    construction_address VARCHAR(500),
    construction_unit VARCHAR(200),
    contractor_unit VARCHAR(200),
    start_date DATE,
    end_date DATE,
    project_manager VARCHAR(100),
    manager_phone VARCHAR(20),
    description VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    archived INT NOT NULL DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS construction_area (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    area_code VARCHAR(50),
    area_type VARCHAR(50),
    building_unit VARCHAR(100),
    construction_section VARCHAR(100),
    manager_name VARCHAR(100),
    manager_phone VARCHAR(20),
    description VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id)
);
