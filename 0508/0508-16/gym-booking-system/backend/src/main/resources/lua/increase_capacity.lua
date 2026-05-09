-- Lua脚本：原子性恢复课程剩余名额（补偿机制）
-- 参数：
-- KEYS[1]: 课程容量的Redis Key (course:capacity:{courseId})
-- ARGV[1]: 最大容量上限（防止超出课程最大容量）
-- 返回值：
-- >= 0: 恢复成功，返回恢复后的剩余名额
-- -1: 已达到最大容量，无需恢复
-- -2: 课程缓存不存在

local capacityKey = KEYS[1]
local maxCapacity = tonumber(ARGV[1])

-- 检查key是否存在
local exists = redis.call('EXISTS', capacityKey)

if exists == 0 then
    return -2
end

-- 获取当前值
local current = tonumber(redis.call('GET', capacityKey))

-- 检查是否已经达到或超过最大容量
if current >= maxCapacity then
    return -1
end

-- 原子增加
local newRemaining = redis.call('INCR', capacityKey)

return newRemaining
