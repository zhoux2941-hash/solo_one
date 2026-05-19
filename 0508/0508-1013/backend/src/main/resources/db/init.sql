-- 创建数据库
CREATE DATABASE IF NOT EXISTS kindergarten DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE kindergarten;

-- 床位表会自动创建，这里可以添加一些索引优化
CREATE INDEX IF NOT EXISTS idx_temperature_record_bed_no ON temperature_record(bed_no);
CREATE INDEX IF NOT EXISTS idx_temperature_record_record_time ON temperature_record(record_time);
CREATE INDEX IF NOT EXISTS idx_temperature_record_abnormal ON temperature_record(is_abnormal);
