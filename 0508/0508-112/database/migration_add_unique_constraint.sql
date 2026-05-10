-- 修复重复申请问题：为 carpool_requests 表添加唯一约束
-- 用于已存在的数据库迁移

USE carpool;

-- 1. 先清理可能存在的重复数据（只保留最新的一条）
DELETE t1 FROM carpool_requests t1
INNER JOIN carpool_requests t2 
WHERE t1.id < t2.id 
AND t1.trip_id = t2.trip_id 
AND t1.requester_id = t2.requester_id;

-- 2. 添加唯一约束（防止同一用户对同一行程重复申请）
-- IGNORE 关键字：如果有重复数据，MySQL会删除重复行只保留一行
ALTER TABLE carpool_requests 
ADD CONSTRAINT uk_trip_requester 
UNIQUE (trip_id, requester_id);

-- 3. 验证约束是否添加成功
SHOW INDEX FROM carpool_requests WHERE Key_name = 'uk_trip_requester';
