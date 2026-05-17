CREATE TABLE IF NOT EXISTS camp_area (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    area_name VARCHAR(100) NOT NULL,
    area_type VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    area_size DOUBLE,
    max_capacity INT,
    status VARCHAR(20),
    description VARCHAR(500),
    create_time TIMESTAMP,
    update_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    facility_name VARCHAR(100) NOT NULL,
    facility_type VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    quantity INT,
    status VARCHAR(20),
    condition_level VARCHAR(20),
    last_maintenance_date TIMESTAMP,
    description VARCHAR(500),
    create_time TIMESTAMP,
    update_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS camp_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_leader VARCHAR(50),
    leader_id_card VARCHAR(20),
    leader_phone VARCHAR(20),
    people_count INT,
    camp_area_id BIGINT,
    check_in_time TIMESTAMP,
    check_out_time TIMESTAMP,
    status VARCHAR(20),
    notes VARCHAR(500),
    create_time TIMESTAMP,
    update_time TIMESTAMP
);

CREATE TABLE IF NOT EXISTS usage_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_type VARCHAR(50),
    area_id BIGINT,
    camp_record_id BIGINT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_hours DOUBLE,
    maintenance_status VARCHAR(20),
    maintenance_notes VARCHAR(500),
    maintenance_person VARCHAR(50),
    maintenance_date TIMESTAMP,
    notes VARCHAR(500),
    create_time TIMESTAMP,
    update_time TIMESTAMP
);
