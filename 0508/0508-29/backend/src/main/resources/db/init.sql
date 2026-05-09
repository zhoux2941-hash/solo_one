CREATE DATABASE IF NOT EXISTS pool_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE pool_db;

DROP TABLE IF EXISTS lane_tolerance;

CREATE TABLE IF NOT EXISTS lane_tolerance (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    lane_name VARCHAR(50) NOT NULL,
    tolerance_value INT NOT NULL,
    zone VARCHAR(20),
    record_date DATE NOT NULL,
    UNIQUE KEY uk_lane_date (lane_name, record_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO lane_tolerance (lane_name, tolerance_value, zone, record_date) VALUES
('浅水区1号道', 25, 'shallower', '2026-05-01'),
('浅水区2号道', 30, 'shallower', '2026-05-01'),
('浅水区3号道', 28, 'shallower', '2026-05-01'),
('浅水区4号道', 22, 'shallower', '2026-05-01'),
('深水区1号道', 75, 'deeper', '2026-05-01'),
('深水区2号道', 82, 'deeper', '2026-05-01'),
('深水区3号道', 78, 'deeper', '2026-05-01'),

('浅水区1号道', 28, 'shallower', '2026-05-02'),
('浅水区2号道', 32, 'shallower', '2026-05-02'),
('浅水区3号道', 30, 'shallower', '2026-05-02'),
('浅水区4号道', 25, 'shallower', '2026-05-02'),
('深水区1号道', 78, 'deeper', '2026-05-02'),
('深水区2号道', 85, 'deeper', '2026-05-02'),
('深水区3号道', 80, 'deeper', '2026-05-02'),

('浅水区1号道', 23, 'shallower', '2026-05-03'),
('浅水区2号道', 27, 'shallower', '2026-05-03'),
('浅水区3号道', 26, 'shallower', '2026-05-03'),
('浅水区4号道', 20, 'shallower', '2026-05-03'),
('深水区1号道', 72, 'deeper', '2026-05-03'),
('深水区2号道', 79, 'deeper', '2026-05-03'),
('深水区3号道', 75, 'deeper', '2026-05-03'),

('浅水区1号道', 30, 'shallower', '2026-05-04'),
('浅水区2号道', 35, 'shallower', '2026-05-04'),
('浅水区3号道', 32, 'shallower', '2026-05-04'),
('浅水区4号道', 27, 'shallower', '2026-05-04'),
('深水区1号道', 80, 'deeper', '2026-05-04'),
('深水区2号道', 88, 'deeper', '2026-05-04'),
('深水区3号道', 83, 'deeper', '2026-05-04'),

('浅水区1号道', 27, 'shallower', '2026-05-05'),
('浅水区2号道', 31, 'shallower', '2026-05-05'),
('浅水区3号道', 29, 'shallower', '2026-05-05'),
('浅水区4号道', 24, 'shallower', '2026-05-05'),
('深水区1号道', 76, 'deeper', '2026-05-05'),
('深水区2号道', 83, 'deeper', '2026-05-05'),
('深水区3号道', 79, 'deeper', '2026-05-05'),

('浅水区1号道', 24, 'shallower', '2026-05-06'),
('浅水区2号道', 29, 'shallower', '2026-05-06'),
('浅水区3号道', 27, 'shallower', '2026-05-06'),
('浅水区4号道', 21, 'shallower', '2026-05-06'),
('深水区1号道', 74, 'deeper', '2026-05-06'),
('深水区2号道', 81, 'deeper', '2026-05-06'),
('深水区3号道', 77, 'deeper', '2026-05-06'),

('浅水区1号道', 29, 'shallower', '2026-05-07'),
('浅水区2号道', 33, 'shallower', '2026-05-07'),
('浅水区3号道', 31, 'shallower', '2026-05-07'),
('浅水区4号道', 26, 'shallower', '2026-05-07'),
('深水区1号道', 79, 'deeper', '2026-05-07'),
('深水区2号道', 86, 'deeper', '2026-05-07'),
('深水区3号道', 81, 'deeper', '2026-05-07'),

('浅水区1号道', 26, 'shallower', '2026-05-08'),
('浅水区2号道', 30, 'shallower', '2026-05-08'),
('浅水区3号道', 28, 'shallower', '2026-05-08'),
('浅水区4号道', 23, 'shallower', '2026-05-08'),
('深水区1号道', 75, 'deeper', '2026-05-08'),
('深水区2号道', 82, 'deeper', '2026-05-08'),
('深水区3号道', 78, 'deeper', '2026-05-08'),

('浅水区1号道', 31, 'shallower', '2026-05-09'),
('浅水区2号道', 36, 'shallower', '2026-05-09'),
('浅水区3号道', 33, 'shallower', '2026-05-09'),
('浅水区4号道', 28, 'shallower', '2026-05-09'),
('深水区1号道', 81, 'deeper', '2026-05-09'),
('深水区2号道', 89, 'deeper', '2026-05-09'),
('深水区3号道', 84, 'deeper', '2026-05-09');
