CREATE DATABASE IF NOT EXISTS chemical_management DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE chemical_management;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    real_name VARCHAR(50) NOT NULL,
    role ENUM('LAB_TECHNICIAN', 'SAFETY_OFFICER', 'DIRECTOR') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS chemicals (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    cas_number VARCHAR(20) NOT NULL UNIQUE,
    current_stock DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(10) NOT NULL,
    danger_level ENUM('HIGH', 'MEDIUM', 'LOW') NOT NULL,
    version INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS applications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    applicant_id BIGINT NOT NULL,
    chemical_id BIGINT NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    expected_date DATE NOT NULL,
    status ENUM('PENDING_FIRST_REVIEW', 'PENDING_SECOND_REVIEW', 'FIRST_REVIEW_REJECTED', 'SECOND_REVIEW_REJECTED', 'COMPLETED', 'AUTO_REJECTED', 'RETURNED', 'OVERDUE') NOT NULL,
    safety_officer_id BIGINT,
    safety_review_time DATETIME,
    safety_comment VARCHAR(500),
    director_id BIGINT,
    director_review_time DATETIME,
    director_comment VARCHAR(500),
    created_at DATETIME NOT NULL,
    version INT DEFAULT 0,
    planned_return_date DATE,
    actual_return_time DATETIME,
    is_overdue BOOLEAN DEFAULT FALSE,
    overdue_reason VARCHAR(500),
    FOREIGN KEY (applicant_id) REFERENCES users(id),
    FOREIGN KEY (chemical_id) REFERENCES chemicals(id),
    FOREIGN KEY (safety_officer_id) REFERENCES users(id),
    FOREIGN KEY (director_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    content VARCHAR(1000) NOT NULL,
    type ENUM('OVERDUE_REMINDER', 'APPROVAL_PASSED', 'APPROVAL_REJECTED', 'RETURN_REMINDER') NOT NULL,
    application_id BIGINT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (application_id) REFERENCES applications(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE applications ADD COLUMN IF NOT EXISTS version INT DEFAULT 0;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS planned_return_date DATE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS actual_return_time DATETIME;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT FALSE;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS overdue_reason VARCHAR(500);
