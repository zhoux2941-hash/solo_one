CREATE DATABASE IF NOT EXISTS meteor_spectra CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE meteor_spectra;

CREATE TABLE IF NOT EXISTS meteor_spectra (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    original_filename VARCHAR(255) NOT NULL,
    stored_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    min_wavelength DOUBLE,
    max_wavelength DOUBLE,
    start_pixel_x INT,
    start_pixel_y INT,
    end_pixel_x INT,
    end_pixel_y INT,
    velocity DOUBLE,
    notes TEXT,
    uploader_name VARCHAR(100),
    upload_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    view_count BIGINT DEFAULT 0,
    INDEX idx_velocity (velocity),
    INDEX idx_upload_time (upload_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS emission_lines (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    spectra_id BIGINT NOT NULL,
    element VARCHAR(50) NOT NULL,
    wavelength DOUBLE NOT NULL,
    intensity DOUBLE,
    is_auto_detected BOOLEAN DEFAULT FALSE,
    notes VARCHAR(500),
    INDEX idx_spectra_id (spectra_id),
    INDEX idx_element (element),
    FOREIGN KEY (spectra_id) REFERENCES meteor_spectra(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS spectrum_data_points (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    spectra_id BIGINT NOT NULL,
    wavelength DOUBLE NOT NULL,
    intensity DOUBLE NOT NULL,
    pixel_index INT NOT NULL,
    INDEX idx_spectra_id (spectra_id),
    FOREIGN KEY (spectra_id) REFERENCES meteor_spectra(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
