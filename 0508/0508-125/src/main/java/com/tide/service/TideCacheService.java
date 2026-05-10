package com.tide.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tide.model.TideRecord;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class TideCacheService {

    private static final String TIDE_CACHE_PREFIX = "tide:table:";
    private static final String MONTH_CACHE_PREFIX = "tide:month:";
    private static final Duration CACHE_EXPIRY = Duration.ofHours(24);

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    public void cacheDailyTideTable(Long locationId, LocalDate date, List<TideRecord> records) {
        String key = buildDailyKey(locationId, date);
        try {
            String json = objectMapper.writeValueAsString(records);
            redisTemplate.opsForValue().set(key, json, CACHE_EXPIRY.toHours(), TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize tide data", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TideRecord> getCachedDailyTideTable(Long locationId, LocalDate date) {
        String key = buildDailyKey(locationId, date);
        Object cached = redisTemplate.opsForValue().get(key);
        
        if (cached instanceof String) {
            try {
                return objectMapper.readValue(
                    (String) cached,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, TideRecord.class)
                );
            } catch (JsonProcessingException e) {
                return null;
            }
        }
        return null;
    }

    public void cacheMonthlyTideTable(Long locationId, int year, int month, List<TideRecord> records) {
        String key = buildMonthlyKey(locationId, year, month);
        try {
            String json = objectMapper.writeValueAsString(records);
            redisTemplate.opsForValue().set(key, json, CACHE_EXPIRY.toHours(), TimeUnit.HOURS);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("Failed to serialize tide data", e);
        }
    }

    @SuppressWarnings("unchecked")
    public List<TideRecord> getCachedMonthlyTideTable(Long locationId, int year, int month) {
        String key = buildMonthlyKey(locationId, year, month);
        Object cached = redisTemplate.opsForValue().get(key);
        
        if (cached instanceof String) {
            try {
                return objectMapper.readValue(
                    (String) cached,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, TideRecord.class)
                );
            } catch (JsonProcessingException e) {
                return null;
            }
        }
        return null;
    }

    public void invalidateLocationCache(Long locationId) {
        String pattern = TIDE_CACHE_PREFIX + locationId + ":*";
        redisTemplate.delete(redisTemplate.keys(pattern));
        
        String monthPattern = MONTH_CACHE_PREFIX + locationId + ":*";
        redisTemplate.delete(redisTemplate.keys(monthPattern));
    }

    private String buildDailyKey(Long locationId, LocalDate date) {
        return TIDE_CACHE_PREFIX + locationId + ":" + date.toString();
    }

    private String buildMonthlyKey(Long locationId, int year, int month) {
        return MONTH_CACHE_PREFIX + locationId + ":" + year + "-" + String.format("%02d", month);
    }
}
