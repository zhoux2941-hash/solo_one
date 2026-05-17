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

CREATE TABLE IF NOT EXISTS labor_team (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    team_name VARCHAR(100) NOT NULL,
    team_code VARCHAR(50),
    team_type VARCHAR(50),
    team_leader VARCHAR(100),
    leader_phone VARCHAR(20),
    description VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE IF NOT EXISTS labor_worker (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    team_id BIGINT,
    area_id BIGINT,
    worker_name VARCHAR(100) NOT NULL,
    id_card VARCHAR(18) NOT NULL UNIQUE,
    phone VARCHAR(20),
    gender VARCHAR(10),
    age INT,
    work_type VARCHAR(50),
    certificate_type VARCHAR(100),
    certificate_no VARCHAR(100),
    entry_date DATE,
    exit_date DATE,
    address VARCHAR(500),
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(20),
    remark VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (team_id) REFERENCES labor_team(id),
    FOREIGN KEY (area_id) REFERENCES construction_area(id)
);

CREATE TABLE IF NOT EXISTS labor_attendance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    worker_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    attendance_date DATE NOT NULL,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    work_hours DECIMAL(5,2) DEFAULT 0,
    attendance_type VARCHAR(50),
    location VARCHAR(200),
    remark VARCHAR(500),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES labor_worker(id),
    FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE IF NOT EXISTS labor_work_hour (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    worker_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    statistics_date DATE NOT NULL,
    statistics_type VARCHAR(20) NOT NULL,
    attendance_days INT DEFAULT 0,
    total_work_hours DECIMAL(10,2) DEFAULT 0,
    overtime_hours DECIMAL(10,2) DEFAULT 0,
    normal_hours DECIMAL(10,2) DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (worker_id) REFERENCES labor_worker(id),
    FOREIGN KEY (project_id) REFERENCES project(id),
    CONSTRAINT unique_worker_statistics UNIQUE (worker_id, statistics_date, statistics_type)
);

CREATE TABLE IF NOT EXISTS material (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    material_name VARCHAR(200) NOT NULL,
    material_code VARCHAR(50),
    material_type VARCHAR(50) NOT NULL,
    specification VARCHAR(200),
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(12,2),
    supplier VARCHAR(200),
    min_stock_quantity DECIMAL(12,2) DEFAULT 0,
    description VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE IF NOT EXISTS material_inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    material_id BIGINT NOT NULL UNIQUE,
    project_id BIGINT NOT NULL,
    current_quantity DECIMAL(12,2) DEFAULT 0,
    total_in_quantity DECIMAL(12,2) DEFAULT 0,
    total_out_quantity DECIMAL(12,2) DEFAULT 0,
    total_return_quantity DECIMAL(12,2) DEFAULT 0,
    last_in_time TIMESTAMP,
    last_out_time TIMESTAMP,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (material_id) REFERENCES material(id),
    FOREIGN KEY (project_id) REFERENCES project(id)
);

CREATE TABLE IF NOT EXISTS material_in_out (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    material_id BIGINT NOT NULL,
    bill_no VARCHAR(50) NOT NULL UNIQUE,
    bill_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(12,2) NOT NULL,
    unit_price DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    handler VARCHAR(100),
    handler_phone VARCHAR(20),
    construction_area VARCHAR(200),
    supplier VARCHAR(200),
    receiver VARCHAR(100),
    remark VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (material_id) REFERENCES material(id)
);

CREATE TABLE IF NOT EXISTS construction_node (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    parent_id BIGINT,
    node_name VARCHAR(200) NOT NULL,
    node_code VARCHAR(50),
    node_type VARCHAR(50),
    node_order INT DEFAULT 0,
    planned_start_date DATE,
    planned_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    planned_workload DECIMAL(10,2),
    completed_workload DECIMAL(10,2) DEFAULT 0,
    progress_rate DECIMAL(5,2) DEFAULT 0,
    responsible_person VARCHAR(100),
    responsible_phone VARCHAR(20),
    current_status VARCHAR(50) DEFAULT 'NOT_STARTED',
    obstacles TEXT,
    description VARCHAR(1000),
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES project(id),
    FOREIGN KEY (parent_id) REFERENCES construction_node(id)
);

CREATE TABLE IF NOT EXISTS node_progress_report (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    node_id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    report_date DATE NOT NULL,
    reporter VARCHAR(100),
    reporter_phone VARCHAR(20),
    completed_workload DECIMAL(10,2) DEFAULT 0,
    progress_rate DECIMAL(5,2) DEFAULT 0,
    work_content TEXT,
    obstacles TEXT,
    solutions TEXT,
    next_plan TEXT,
    weather_condition VARCHAR(50),
    worker_count INT DEFAULT 0,
    status INT NOT NULL DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES construction_node(id),
    FOREIGN KEY (project_id) REFERENCES project(id)
);
