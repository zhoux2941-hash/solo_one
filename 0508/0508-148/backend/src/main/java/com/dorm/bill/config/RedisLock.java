package com.dorm.bill.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Component
public class RedisLock {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    public boolean tryLock(String key, long timeout, TimeUnit unit) {
        Boolean result = stringRedisTemplate.opsForValue()
                .setIfAbsent(key, "locked", timeout, unit);
        return Boolean.TRUE.equals(result);
    }

    public void unlock(String key) {
        stringRedisTemplate.delete(key);
    }
}
