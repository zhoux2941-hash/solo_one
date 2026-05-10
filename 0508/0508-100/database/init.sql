CREATE DATABASE IF NOT EXISTS canteen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE canteen_db;

DROP TABLE IF EXISTS special_event;
DROP TABLE IF EXISTS food_waste;

CREATE TABLE food_waste (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_date DATE NOT NULL,
    meal_type VARCHAR(20) NOT NULL,
    weight_kg DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_date_meal (record_date, meal_type)
);

CREATE TABLE special_event (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    event_date DATE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    impact_factor DOUBLE NOT NULL DEFAULT 1.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO food_waste (record_date, meal_type, weight_kg) VALUES
('2026-04-10', '午餐', 6.20), ('2026-04-10', '晚餐', 4.50),
('2026-04-11', '午餐', 5.80), ('2026-04-11', '晚餐', 3.90),
('2026-04-12', '午餐', 12.80), ('2026-04-12', '晚餐', 8.90),
('2026-04-13', '午餐', 14.20), ('2026-04-13', '晚餐', 11.80),
('2026-04-14', '午餐', 13.50), ('2026-04-14', '晚餐', 10.20),
('2026-04-15', '午餐', 15.10), ('2026-04-15', '晚餐', 12.10),
('2026-04-16', '午餐', 14.80), ('2026-04-16', '晚餐', 11.90),
('2026-04-17', '午餐', 6.50), ('2026-04-17', '晚餐', 4.80),
('2026-04-18', '午餐', 5.40), ('2026-04-18', '晚餐', 3.60),
('2026-04-19', '午餐', 12.10), ('2026-04-19', '晚餐', 8.50),
('2026-04-20', '午餐', 13.30), ('2026-04-20', '晚餐', 10.40),
('2026-04-21', '午餐', 14.50), ('2026-04-21', '晚餐', 11.60),
('2026-04-22', '午餐', 15.00), ('2026-04-22', '晚餐', 12.00),
('2026-04-23', '午餐', 13.90), ('2026-04-23', '晚餐', 11.10),
('2026-04-24', '午餐', 7.10), ('2026-04-24', '晚餐', 5.20),
('2026-04-25', '午餐', 5.60), ('2026-04-25', '晚餐', 3.80),
('2026-04-26', '午餐', 12.70), ('2026-04-26', '晚餐', 9.00),
('2026-04-27', '午餐', 13.60), ('2026-04-27', '晚餐', 10.80),
('2026-04-28', '午餐', 14.30), ('2026-04-28', '晚餐', 11.50),
('2026-04-29', '午餐', 15.20), ('2026-04-29', '晚餐', 12.40),
('2026-04-30', '午餐', 14.10), ('2026-04-30', '晚餐', 11.30),
('2026-05-01', '午餐', 6.80), ('2026-05-01', '晚餐', 5.00),
('2026-05-02', '午餐', 5.90), ('2026-05-02', '晚餐', 4.10),
('2026-05-03', '午餐', 13.20), ('2026-05-03', '晚餐', 9.60),
('2026-05-04', '午餐', 14.50), ('2026-05-04', '晚餐', 11.90),
('2026-05-05', '午餐', 13.80), ('2026-05-05', '晚餐', 10.50),
('2026-05-06', '午餐', 15.30), ('2026-05-06', '晚餐', 12.20),
('2026-05-07', '午餐', 14.60), ('2026-05-07', '晚餐', 11.70),
('2026-05-08', '午餐', 6.30), ('2026-05-08', '晚餐', 4.60),
('2026-05-09', '午餐', 5.70), ('2026-05-09', '晚餐', 3.80);

INSERT INTO special_event (event_date, event_type, description, impact_factor) VALUES
('2026-04-15', '大型活动', '春季运动会', 1.35),
('2026-04-22', '菜品更换', '新菜单上线', 0.85),
('2026-04-28', '大型活动', '职业培训讲座', 1.25),
('2026-05-06', '大型活动', '科技节展览', 1.40);
