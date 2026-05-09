-- Lua脚本：原子性检查并扣减课程剩余名额
-- 参数：
-- KEYS[1]: 课程容量的Redis Key (course:capacity:{courseId})
-- ARGV[1]: 默认容量（当缓存不存在时从数据库获取）
-- ARGV[2]: 过期时间（小时）
-- 返回值：
-- 1: 扣减成功，返回扣减后的剩余名额
-- -1: 剩余名额不足，扣减失败
-- -2: 课程不存在或缓存初始化失败

local capacityKey = KEYS[1]
local defaultCapacity = tonumber(ARGV[1])
local expireHours = tonumber(ARGV[2])

-- 检查key是否存在
local exists = redis.call('EXISTS', capacityKey)

local remaining = 0

if exists == 1 then
    -- key存在，获取当前值
    remaining = tonumber(redis.call('GET', capacityKey))
else
    -- key不存在，使用默认值初始化
    if defaultCapacity and defaultCapacity > 0 then
        redis.call('SET', capacityKey, defaultCapacity)
        redis.call('EXPIRE', capacityKey, expireHours * 3600)
        remaining = defaultCapacity
    else
        return -2
    end
end

-- 检查剩余名额
if remaining <= 0 then
    return -1
end

-- 原子扣减
local newRemaining = redis.call('DECR', capacityKey)

-- 再次检查扣减后的值
if newRemaining < 0 then
    -- 理论上不会走到这里，因为上面已经检查过，但为了安全起见
    redis.call('INCR', capacityKey)
    return -1
end

return newRemaining
