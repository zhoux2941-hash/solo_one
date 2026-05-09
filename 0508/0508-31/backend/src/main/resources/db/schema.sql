CREATE DATABASE IF NOT EXISTS park_bench DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE park_bench;

DROP TABLE IF EXISTS bench_daily_stats;
DROP TABLE IF EXISTS bench;

CREATE TABLE bench (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bench_code VARCHAR(50) NOT NULL UNIQUE COMMENT '长椅编号',
    bench_name VARCHAR(100) NOT NULL COMMENT '长椅名称',
    area VARCHAR(20) NOT NULL COMMENT '区域：东区/西区',
    orientation VARCHAR(50) NOT NULL COMMENT '朝向：朝南/朝东/朝西'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='长椅信息表';

CREATE TABLE bench_daily_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bench_id BIGINT NOT NULL COMMENT '关联长椅ID',
    stat_date DATE NOT NULL COMMENT '统计日期',
    sun_duration_minutes INT NOT NULL DEFAULT 0 COMMENT '阳光直射时长（分钟）',
    shadow_percentage DOUBLE NOT NULL DEFAULT 0 COMMENT '阴影占比（百分比，0-100）',
    total_daylight_minutes INT NOT NULL DEFAULT 720 COMMENT '当天天光总时长（分钟，默认12小时=720分钟）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uk_bench_date (bench_id, stat_date),
    KEY idx_stat_date (stat_date),
    CONSTRAINT fk_bench_stats FOREIGN KEY (bench_id) REFERENCES bench(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='长椅每日统计表';

INSERT INTO bench (bench_code, bench_name, area, orientation) VALUES
('EAST-1', '东区1号长椅', '东区', '朝南'),
('EAST-2', '东区2号长椅', '东区', '朝南'),
('EAST-3', '东区3号长椅', '东区', '朝东'),
('EAST-4', '东区4号长椅', '东区', '朝东'),
('WEST-1', '西区1号长椅', '西区', '朝南'),
('WEST-2', '西区2号长椅', '西区', '朝南'),
('WEST-3', '西区3号长椅', '西区', '朝西'),
('WEST-4', '西区4号长椅', '西区', '朝西');

SET @today = CURDATE();
SET @total_daylight = 720;

INSERT INTO bench_daily_stats (bench_id, stat_date, sun_duration_minutes, shadow_percentage, total_daylight_minutes) VALUES
(1, @today, 420, ROUND(((@total_daylight - 420) / @total_daylight) * 100, 1), @total_daylight),
(2, @today, 400, ROUND(((@total_daylight - 400) / @total_daylight) * 100, 1), @total_daylight),
(3, @today, 480, ROUND(((@total_daylight - 480) / @total_daylight) * 100, 1), @total_daylight),
(4, @today, 450, ROUND(((@total_daylight - 450) / @total_daylight) * 100, 1), @total_daylight),
(5, @today, 280, ROUND(((@total_daylight - 280) / @total_daylight) * 100, 1), @total_daylight),
(6, @today, 300, ROUND(((@total_daylight - 300) / @total_daylight) * 100, 1), @total_daylight),
(7, @today, 240, ROUND(((@total_daylight - 240) / @total_daylight) * 100, 1), @total_daylight),
(8, @today, 260, ROUND(((@total_daylight - 260) / @total_daylight) * 100, 1), @total_daylight);
