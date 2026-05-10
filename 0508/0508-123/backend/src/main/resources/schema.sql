CREATE DATABASE IF NOT EXISTS astro_booking DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE astro_booking;

CREATE TABLE IF NOT EXISTS telescopes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    primary_mirror VARCHAR(255) NOT NULL,
    camera_model VARCHAR(255) NOT NULL,
    field_of_view DOUBLE NOT NULL,
    limiting_magnitude DOUBLE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    min_elevation DOUBLE NOT NULL DEFAULT 15.0,
    description TEXT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    telescope_id BIGINT NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    ra DOUBLE NOT NULL,
    dec DOUBLE NOT NULL,
    exposure_time INT NOT NULL,
    target_name VARCHAR(255) NOT NULL,
    elevation DOUBLE,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_telescope_id (telescope_id),
    INDEX idx_user_id (user_id),
    INDEX idx_start_time (start_time),
    INDEX idx_status (status),
    FOREIGN KEY (telescope_id) REFERENCES telescopes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS observation_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    booking_id BIGINT NOT NULL UNIQUE,
    raw_image_path VARCHAR(500) NOT NULL,
    flat_image_path VARCHAR(500) NOT NULL,
    calibrated_image_path VARCHAR(500) NOT NULL,
    avg_sky_brightness DOUBLE NOT NULL,
    generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_booking_id (booking_id),
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO telescopes (name, primary_mirror, camera_model, field_of_view, limiting_magnitude, status, min_elevation, description) VALUES
('天文望远镜 A', '200mm f/8 牛顿反射镜', 'ZWO ASI294MC Pro', 1.2, 16.5, 'AVAILABLE', 15.0, '学校主要观测望远镜，适合深空天体摄影'),
('天文望远镜 B', '150mm f/5 折射镜', 'QHYCCD QHY163C', 2.5, 15.0, 'AVAILABLE', 20.0, '便携式望远镜，适合行星和月球观测'),
('天文望远镜 C', '300mm f/4 施密特-卡塞格林', 'Starlight Xpress Trius SX-825', 0.8, 18.0, 'AVAILABLE', 10.0, '高端科研级望远镜，适合深空摄影');
