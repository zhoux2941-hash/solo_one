CREATE DATABASE IF NOT EXISTS iss_tracker 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE iss_tracker;

CREATE TABLE IF NOT EXISTS observation_records (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  pass_event_id VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  description VARCHAR(500),
  observed_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_pass_event_id (pass_event_id),
  INDEX idx_latitude (latitude),
  INDEX idx_longitude (longitude),
  INDEX idx_observed_at (observed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_identifier VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  location_name VARCHAR(100),
  notify_iss_pass BOOLEAN NOT NULL DEFAULT FALSE,
  notify_iridium_flare BOOLEAN NOT NULL DEFAULT FALSE,
  min_brightness DOUBLE DEFAULT -3.0,
  min_elevation DOUBLE DEFAULT 10.0,
  notification_method VARCHAR(50),
  notification_target VARCHAR(255),
  advance_notice_minutes INT DEFAULT 15,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL,
  updated_at DATETIME,
  INDEX idx_user_identifier (user_identifier),
  INDEX idx_latitude (latitude),
  INDEX idx_longitude (longitude),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
