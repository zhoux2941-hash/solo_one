package com.fulfillment.order.service;

import com.fulfillment.order.mapper.DistributedLockMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

@Slf4j
@Service
@RequiredArgsConstructor
public class DistributedLockService {

    private final DistributedLockMapper distributedLockMapper;

    private final String instanceId = generateInstanceId();

    private static final int DEFAULT_LOCK_EXPIRE_SECONDS = 120;

    private String generateInstanceId() {
        try {
            String hostName = InetAddress.getLocalHost().getHostName();
            String uuid = UUID.randomUUID().toString().replace("-", "").substring(0, 8);
            return hostName + "-" + uuid;
        } catch (UnknownHostException e) {
            return "unknown-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public boolean tryLock(String lockKey, int expireSeconds) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expireTime = now.plusSeconds(expireSeconds);

        try {
            int rows = distributedLockMapper.tryAcquireLock(lockKey, instanceId, now, expireTime, now);
            if (rows > 0) {
                log.info("获取分布式锁成功, lockKey: {}, holder: {}", lockKey, instanceId);
                return true;
            }

            try {
                distributedLockMapper.insertLock(lockKey, instanceId, now, expireTime);
                log.info("创建并获取分布式锁成功, lockKey: {}, holder: {}", lockKey, instanceId);
                return true;
            } catch (Exception e) {
                log.debug("锁已存在, lockKey: {}", lockKey);
                return false;
            }
        } catch (Exception e) {
            log.error("获取分布式锁异常, lockKey: {}", lockKey, e);
            return false;
        }
    }

    public boolean tryLock(String lockKey) {
        return tryLock(lockKey, DEFAULT_LOCK_EXPIRE_SECONDS);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public boolean releaseLock(String lockKey) {
        try {
            int rows = distributedLockMapper.releaseLock(lockKey, instanceId);
            if (rows > 0) {
                log.info("释放分布式锁成功, lockKey: {}, holder: {}", lockKey, instanceId);
                return true;
            } else {
                log.warn("释放分布式锁失败，可能已过期或被其他节点持有, lockKey: {}, holder: {}", lockKey, instanceId);
                return false;
            }
        } catch (Exception e) {
            log.error("释放分布式锁异常, lockKey: {}", lockKey, e);
            return false;
        }
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW, rollbackFor = Exception.class)
    public void cleanExpiredLocks() {
        LocalDateTime now = LocalDateTime.now();
        int rows = distributedLockMapper.deleteExpiredLocks(now);
        if (rows > 0) {
            log.info("清理了{}个过期的分布式锁", rows);
        }
    }

    public String getCurrentHolder(String lockKey) {
        return distributedLockMapper.getLockHolder(lockKey);
    }

    public String getInstanceId() {
        return instanceId;
    }

    public LockCallback executeWithLock(String lockKey, int expireSeconds, LockCallback callback) {
        LockCallback result = new LockCallback();
        boolean locked = false;

        try {
            locked = tryLock(lockKey, expireSeconds);
            result.setLockAcquired(locked);

            if (!locked) {
                log.info("未获取到分布式锁, lockKey: {}", lockKey);
                result.setSuccess(false);
                return result;
            }

            try {
                callback.execute();
                result.setSuccess(true);
            } catch (Exception e) {
                log.error("执行锁保护的任务异常, lockKey: {}", lockKey, e);
                result.setSuccess(false);
                result.setException(e);
                throw e;
            }
        } finally {
            if (locked) {
                releaseLock(lockKey);
            }
        }

        return result;
    }

    public static class LockCallback {
        private boolean lockAcquired = false;
        private boolean success = false;
        private Exception exception = null;

        public void execute() throws Exception {
        }

        public boolean isLockAcquired() {
            return lockAcquired;
        }

        public void setLockAcquired(boolean lockAcquired) {
            this.lockAcquired = lockAcquired;
        }

        public boolean isSuccess() {
            return success;
        }

        public void setSuccess(boolean success) {
            this.success = success;
        }

        public Exception getException() {
            return exception;
        }

        public void setException(Exception exception) {
            this.exception = exception;
        }
    }
}
