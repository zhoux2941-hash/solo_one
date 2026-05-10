CREATE DATABASE IF NOT EXISTS exoplanet_transit
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE exoplanet_transit;

CREATE TABLE IF NOT EXISTS star_templates (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  radius DOUBLE NOT NULL,
  temperature DOUBLE NOT NULL,
  description VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS fit_results (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  share_token VARCHAR(32) NOT NULL UNIQUE,
  original_data TEXT NOT NULL,
  fit_data TEXT NOT NULL,
  star_radius DOUBLE NOT NULL,
  star_temperature DOUBLE NOT NULL,
  planet_radius DOUBLE NOT NULL,
  orbital_period DOUBLE NOT NULL,
  inclination DOUBLE NOT NULL,
  fitted_planet_radius DOUBLE NOT NULL,
  fitted_inclination DOUBLE NOT NULL,
  chi_squared DOUBLE NOT NULL,
  matching_degree DOUBLE NOT NULL,
  noise_level DOUBLE NOT NULL,
  created_at DATETIME NOT NULL,
  INDEX idx_share_token (share_token),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;