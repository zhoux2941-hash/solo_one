package com.quiz.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisLockService {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String LOCK_PREFIX = "quiz:lock:";
    private static final Long DEFAULT_EXPIRE_TIME = 10L;

    public boolean tryLock(String lockKey, String requestId) {
        return tryLock(lockKey, requestId, DEFAULT_EXPIRE_TIME, TimeUnit.SECONDS);
    }

    public boolean tryLock(String lockKey, String requestId, long expireTime, TimeUnit timeUnit) {
        String key = LOCK_PREFIX + lockKey;
        Boolean result = redisTemplate.opsForValue().setIfAbsent(key, requestId, expireTime, timeUnit);
        log.debug("tryLock - key: {}, requestId: {}, result: {}", key, requestId, result);
        return Boolean.TRUE.equals(result);
    }

    public boolean releaseLock(String lockKey, String requestId) {
        String key = LOCK_PREFIX + lockKey;
        String script = "if redis.call('get', KEYS[1]) == ARGV[1] then " +
                "return redis.call('del', KEYS[1]) " +
                "else " +
                "return 0 " +
                "end";

        DefaultRedisScript<Long> redisScript = new DefaultRedisScript<>();
        redisScript.setScriptText(script);
        redisScript.setResultType(Long.class);

        Long result = redisTemplate.execute(redisScript, Collections.singletonList(key), requestId);
        log.debug("releaseLock - key: {}, requestId: {}, result: {}", key, requestId, result);
        return result != null && result > 0;
    }

    public Object getLockValue(String lockKey) {
        String key = LOCK_PREFIX + lockKey;
        return redisTemplate.opsForValue().get(key);
    }
}
