-- 添加途经点功能的数据库迁移脚本

USE carpool;

-- 1. 为 trips 表添加 waypoints 字段（存储途经城市，逗号分隔）
ALTER TABLE trips 
ADD COLUMN waypoints VARCHAR(500) NULL 
AFTER destination_city;

-- 2. 验证字段是否添加成功
DESCRIBE trips;
