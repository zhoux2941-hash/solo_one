package com.company.seatbooking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;

@Service
public class DistributedLockService {
    
    private static final Logger logger = LoggerFactory.getLogger(DistributedLockService.class);
    
    private static final String LOCK_PREFIX = "lock:seat:";
    
    private static final long DEFAULT_LOCK_WAIT_TIME = 10;
    private static final TimeUnit DEFAULT_LOCK_WAIT_UNIT = TimeUnit.SECONDS;
    
    private static final long DEFAULT_LOCK_LEASE_TIME = 30;
    private static final TimeUnit DEFAULT_LOCK_LEASE_UNIT = TimeUnit.SECONDS;
    
    private static final long WATCHDOG_INTERVAL = 10;
    private static final TimeUnit WATCHDOG_UNIT = TimeUnit.SECONDS;
    
    private final RedisTemplate<String, String> redisTemplate;
    private final ScheduledExecutorService watchdogExecutor;
    private final Map<String, LockHolder> activeLocks;
    
    private static final String UNLOCK_SCRIPT = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('del', KEYS[1]) " +
        "else " +
        "    return 0 " +
        "end";
    
    private static final String RENEW_SCRIPT = 
        "if redis.call('get', KEYS[1]) == ARGV[1] then " +
        "    return redis.call('expire', KEYS[1], ARGV[2]) " +
        "else " +
        "    return 0 " +
        "end";
    
    public DistributedLockService(RedisTemplate<String, String> redisTemplate) {
        this.redisTemplate = redisTemplate;
        this.watchdogExecutor = Executors.newScheduledThreadPool(2, r -> {
            Thread t = new Thread(r, "lock-watchdog");
            t.setDaemon(true);
            return t;
        });
        this.activeLocks = new ConcurrentHashMap<>();
    }
    
    public String getLockKey(Long seatId, String date, String timeSlot) {
        return LOCK_PREFIX + seatId + ":" + date + ":" + timeSlot;
    }
    
    public String getLockKeyFullDay(Long seatId, String date) {
        return LOCK_PREFIX + seatId + ":" + date + ":FULL_DAY";
    }
    
    public boolean tryLock(String lockKey) {
        return tryLock(lockKey, DEFAULT_LOCK_WAIT_TIME, DEFAULT_LOCK_WAIT_UNIT, 
                       DEFAULT_LOCK_LEASE_TIME, DEFAULT_LOCK_LEASE_UNIT);
    }
    
    public boolean tryLock(String lockKey, long waitTime, TimeUnit waitUnit, 
                           long leaseTime, TimeUnit leaseUnit) {
        String lockValue = UUID.randomUUID().toString();
        long startTime = System.currentTimeMillis();
        long waitMillis = waitUnit.toMillis(waitTime);
        
        while (System.currentTimeMillis() - startTime < waitMillis) {
            Boolean acquired = redisTemplate.opsForValue()
                .setIfAbsent(lockKey, lockValue, leaseTime, leaseUnit);
            
            if (Boolean.TRUE.equals(acquired)) {
                LockHolder holder = new LockHolder(lockKey, lockValue, leaseTime, leaseUnit);
                activeLocks.put(lockKey, holder);
                startWatchdog(holder);
                logger.info("成功获取锁: {}, lockValue: {}", lockKey, lockValue);
                return true;
            }
            
            try {
                Thread.sleep(100);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                return false;
            }
        }
        
        logger.warn("获取锁超时: {}", lockKey);
        return false;
    }
    
    public void unlock(String lockKey) {
        LockHolder holder = activeLocks.remove(lockKey);
        if (holder != null) {
            holder.cancelWatchdog();
            
            DefaultRedisScript<Long> script = new DefaultRedisScript<>();
            script.setScriptText(UNLOCK_SCRIPT);
            script.setResultType(Long.class);
            
            Long result = redisTemplate.execute(script, 
                Collections.singletonList(lockKey), 
                holder.getLockValue());
            
            if (result != null && result == 1) {
                logger.info("成功释放锁: {}", lockKey);
            } else {
                logger.warn("释放锁失败或锁已过期: {}", lockKey);
            }
        }
    }
    
    private void startWatchdog(LockHolder holder) {
        long initialDelay = holder.getLeaseTime() * 2 / 3;
        long period = holder.getLeaseTime() * 2 / 3;
        
        ScheduledFuture<?> future = watchdogExecutor.scheduleAtFixedRate(() -> {
            try {
                renewLock(holder);
            } catch (Exception e) {
                logger.error("Watchdog续期异常: {}", holder.getLockKey(), e);
            }
        }, initialDelay, period, holder.getLeaseUnit());
        
        holder.setWatchdogFuture(future);
        logger.debug("启动Watchdog: {}, initialDelay: {}, period: {}", 
                     holder.getLockKey(), initialDelay, period);
    }
    
    private void renewLock(LockHolder holder) {
        if (!activeLocks.containsKey(holder.getLockKey())) {
            holder.cancelWatchdog();
            return;
        }
        
        long leaseSeconds = holder.getLeaseUnit().toSeconds(holder.getLeaseTime());
        
        DefaultRedisScript<Long> script = new DefaultRedisScript<>();
        script.setScriptText(RENEW_SCRIPT);
        script.setResultType(Long.class);
        
        Long result = redisTemplate.execute(script,
            Collections.singletonList(holder.getLockKey()),
            holder.getLockValue(),
            String.valueOf(leaseSeconds));
        
        if (result != null && result == 1) {
            logger.debug("Watchdog续期成功: {}, 续期时间: {}秒", 
                        holder.getLockKey(), leaseSeconds);
        } else {
            logger.warn("Watchdog续期失败，锁可能已过期: {}", holder.getLockKey());
            holder.cancelWatchdog();
            activeLocks.remove(holder.getLockKey());
        }
    }
    
    public LockContext lock(String lockKey) throws InterruptedException {
        return lock(lockKey, DEFAULT_LOCK_WAIT_TIME, DEFAULT_LOCK_WAIT_UNIT,
                    DEFAULT_LOCK_LEASE_TIME, DEFAULT_LOCK_LEASE_UNIT);
    }
    
    public LockContext lock(String lockKey, long waitTime, TimeUnit waitUnit,
                            long leaseTime, TimeUnit leaseUnit) throws InterruptedException {
        if (tryLock(lockKey, waitTime, waitUnit, leaseTime, leaseUnit)) {
            return new LockContext(this, lockKey);
        }
        throw new InterruptedException("获取锁超时: " + lockKey);
    }
    
    public static class LockContext implements AutoCloseable {
        private final DistributedLockService lockService;
        private final String lockKey;
        private boolean released = false;
        
        public LockContext(DistributedLockService lockService, String lockKey) {
            this.lockService = lockService;
            this.lockKey = lockKey;
        }
        
        @Override
        public void close() {
            if (!released) {
                released = true;
                lockService.unlock(lockKey);
            }
        }
    }
    
    private static class LockHolder {
        private final String lockKey;
        private final String lockValue;
        private final long leaseTime;
        private final TimeUnit leaseUnit;
        private ScheduledFuture<?> watchdogFuture;
        
        public LockHolder(String lockKey, String lockValue, long leaseTime, TimeUnit leaseUnit) {
            this.lockKey = lockKey;
            this.lockValue = lockValue;
            this.leaseTime = leaseTime;
            this.leaseUnit = leaseUnit;
        }
        
        public String getLockKey() { return lockKey; }
        public String getLockValue() { return lockValue; }
        public long getLeaseTime() { return leaseTime; }
        public TimeUnit getLeaseUnit() { return leaseUnit; }
        
        public void setWatchdogFuture(ScheduledFuture<?> future) {
            this.watchdogFuture = future;
        }
        
        public void cancelWatchdog() {
            if (watchdogFuture != null && !watchdogFuture.isCancelled()) {
                watchdogFuture.cancel(false);
                logger.debug("停止Watchdog: {}", lockKey);
            }
        }
    }
}
