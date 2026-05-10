CREATE DATABASE IF NOT EXISTS pet_clean CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pet_clean;

CREATE TABLE IF NOT EXISTS building (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    total_points INT DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    nickname VARCHAR(50) NOT NULL,
    building_id BIGINT,
    total_points INT DEFAULT 0,
    is_admin TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (building_id) REFERENCES building(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cleaning_point (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    description VARCHAR(255),
    status VARCHAR(20) DEFAULT 'clean',
    last_clean_time DATETIME,
    last_clean_user_id BIGINT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (last_clean_user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS cleaning_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    building_id BIGINT,
    cleaning_point_id BIGINT NOT NULL,
    photo_url VARCHAR(500),
    points_earned INT DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (building_id) REFERENCES building(id),
    FOREIGN KEY (cleaning_point_id) REFERENCES cleaning_point(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notification (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    cleaning_point_id BIGINT NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id),
    FOREIGN KEY (cleaning_point_id) REFERENCES cleaning_point(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS community (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    total_cleanliness INT DEFAULT 0,
    total_records INT DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rescue_point (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    latitude DECIMAL(10, 7) NOT NULL,
    longitude DECIMAL(10, 7) NOT NULL,
    animal_type VARCHAR(50),
    description VARCHAR(500),
    photo_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'need_rescue',
    reported_by BIGINT,
    rescued_by BIGINT,
    rescued_time DATETIME,
    rescue_note VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (reported_by) REFERENCES user(id),
    FOREIGN KEY (rescued_by) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS rescue_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    rescue_point_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    action_type VARCHAR(20),
    note VARCHAR(500),
    photo_url VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rescue_point_id) REFERENCES rescue_point(id),
    FOREIGN KEY (user_id) REFERENCES user(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO community (id, total_cleanliness, total_records) VALUES (1, 0, 0);

INSERT INTO building (name) VALUES 
('1号楼'), ('2号楼'), ('3号楼'), ('4号楼'), ('5号楼'),
('6号楼'), ('7号楼'), ('8号楼'), ('9号楼'), ('10号楼');
