package com.driving.util;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import javax.annotation.Resource;
import java.util.concurrent.TimeUnit;

@Component
public class RedisUtil {

    @Resource
    private RedisTemplate<String, Object> redisTemplate;

    private static final String SLOT_STATUS_PREFIX = "slot:status:";
    private static final String SLOT_LOCK_PREFIX = "slot:lock:";
    private static final long LOCK_EXPIRE_TIME = 30;

    public String getSlotKey(Long coachId, String date, int hour) {
        return SLOT_STATUS_PREFIX + coachId + ":" + date + ":" + hour;
    }

    public String getLockKey(Long coachId, String date, int hour) {
        return SLOT_LOCK_PREFIX + coachId + ":" + date + ":" + hour;
    }

    public boolean tryLock(String lockKey) {
        Boolean result = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, System.currentTimeMillis(), LOCK_EXPIRE_TIME, TimeUnit.SECONDS);
        return result != null && result;
    }

    public void unlock(String lockKey) {
        redisTemplate.delete(lockKey);
    }

    public void setSlotStatus(String slotKey, Integer status) {
        redisTemplate.opsForValue().set(slotKey, status);
    }

    public Object getSlotStatus(String slotKey) {
        return redisTemplate.opsForValue().get(slotKey);
    }

    public void deleteSlotStatus(String slotKey) {
        redisTemplate.delete(slotKey);
    }

    public void setSlotStatusWithExpire(String slotKey, Integer status, long seconds) {
        redisTemplate.opsForValue().set(slotKey, status, seconds, TimeUnit.SECONDS);
    }
}