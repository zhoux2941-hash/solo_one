package com.collabdocs.emotionaldocs.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RateLimitService {

    private final StringRedisTemplate stringRedisTemplate;

    private static final String RATE_LIMIT_PREFIX = "ratelimit:sentiment:";
    private static final int MAX_REQUESTS_PER_MINUTE = 1;
    private static final long WINDOW_SECONDS = 60;

    public boolean canRequestAnalysis(Long docId, Long userId) {
        String key = getRateLimitKey(docId, userId);
        
        try {
            String currentCount = stringRedisTemplate.opsForValue().get(key);
            
            if (currentCount == null) {
                stringRedisTemplate.opsForValue().set(key, "1", WINDOW_SECONDS, TimeUnit.SECONDS);
                log.debug("Rate limit check passed for doc {} user {} - first request", docId, userId);
                return true;
            }
            
            int count = Integer.parseInt(currentCount);
            if (count < MAX_REQUESTS_PER_MINUTE) {
                stringRedisTemplate.opsForValue().increment(key);
                log.debug("Rate limit check passed for doc {} user {} - count: {}", docId, userId, count + 1);
                return true;
            }
            
            log.debug("Rate limit exceeded for doc {} user {} - count: {}", docId, userId, count);
            return false;
            
        } catch (Exception e) {
            log.warn("Rate limit check failed, allowing request for doc {} user {}", docId, userId, e);
            return true;
        }
    }

    public void recordAnalysis(Long docId, Long userId) {
        String key = getRateLimitKey(docId, userId);
        try {
            stringRedisTemplate.opsForValue().set(key, "1", WINDOW_SECONDS, TimeUnit.SECONDS);
        } catch (Exception e) {
            log.warn("Failed to record analysis for doc {} user {}", docId, userId, e);
        }
    }

    public long getRemainingTime(Long docId, Long userId) {
        String key = getRateLimitKey(docId, userId);
        try {
            Long ttl = stringRedisTemplate.getExpire(key, TimeUnit.SECONDS);
            return ttl != null ? ttl : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    private String getRateLimitKey(Long docId, Long userId) {
        return RATE_LIMIT_PREFIX + docId + ":" + userId;
    }
}
