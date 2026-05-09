package com.petboarding.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
@RequiredArgsConstructor
public class DistributedLockService {
    
    private final StringRedisTemplate redisTemplate;
    
    private static final String LOCK_PREFIX = "lock:";
    private static final long DEFAULT_WAIT_TIME = 3;
    private static final long DEFAULT_LEASE_TIME = 30;
    
    private static final String UNLOCK_SCRIPT = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    
    private final DefaultRedisScript<Long> unlockScript = new DefaultRedisScript<>(UNLOCK_SCRIPT, Long.class);
    
    public LockResult tryLock(String lockKey) {
        return tryLock(lockKey, DEFAULT_WAIT_TIME, DEFAULT_LEASE_TIME, TimeUnit.SECONDS);
    }
    
    public LockResult tryLock(String lockKey, long waitTime, long leaseTime, TimeUnit unit) {
        String fullKey = LOCK_PREFIX + lockKey;
        String lockValue = UUID.randomUUID().toString();
        
        long startTime = System.currentTimeMillis();
        long waitTimeMillis = unit.toMillis(waitTime);
        
        while (System.currentTimeMillis() - startTime < waitTimeMillis) {
            Boolean acquired = redisTemplate.opsForValue()
                    .setIfAbsent(fullKey, lockValue, leaseTime, unit);
            
            if (Boolean.TRUE.equals(acquired)) {
                log.debug("Lock acquired: {} with value: {}", fullKey, lockValue);
                return new LockResult(true, fullKey, lockValue);
            }
            
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        
        log.warn("Failed to acquire lock: {} after {}ms", fullKey, waitTimeMillis);
        return new LockResult(false, fullKey, null);
    }
    
    public boolean releaseLock(LockResult lockResult) {
        if (lockResult == null || !lockResult.isAcquired()) {
            return true;
        }
        
        Long result = redisTemplate.execute(
                unlockScript,
                Collections.singletonList(lockResult.getLockKey()),
                lockResult.getLockValue()
        );
        
        boolean released = Long.valueOf(1).equals(result);
        if (released) {
            log.debug("Lock released: {}", lockResult.getLockKey());
        } else {
            log.warn("Failed to release lock: {} (may have expired)", lockResult.getLockKey());
        }
        
        return released;
    }
    
    public void executeWithLock(String lockKey, Runnable task) {
        LockResult lock = tryLock(lockKey);
        try {
            if (!lock.isAcquired()) {
                throw new RuntimeException("无法获取锁: " + lockKey);
            }
            task.run();
        } finally {
            releaseLock(lock);
        }
    }
    
    @lombok.Data
    @lombok.AllArgsConstructor
    public static class LockResult {
        private final boolean acquired;
        private final String lockKey;
        private final String lockValue;
    }
}
