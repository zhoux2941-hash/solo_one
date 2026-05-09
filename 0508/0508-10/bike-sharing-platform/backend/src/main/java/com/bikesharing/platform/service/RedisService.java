package com.bikesharing.platform.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class RedisService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    public static final String BIKE_POINT_KEY_PREFIX = "bike:point:";
    public static final String PREDICTION_HASH_KEY = "prediction:demand";
    public static final String HOURLY_DEMAND_KEY = "demand:hourly:past_week";

    public Integer getBikeCount(Long pointId) {
        Object value = redisTemplate.opsForValue().get(BIKE_POINT_KEY_PREFIX + pointId);
        if (value == null) return null;
        if (value instanceof Integer) return (Integer) value;
        return objectMapper.convertValue(value, Integer.class);
    }

    public void setBikeCount(Long pointId, Integer count) {
        redisTemplate.opsForValue().set(BIKE_POINT_KEY_PREFIX + pointId, count);
    }

    public void setBikeCountWithTTL(Long pointId, Integer count, long ttl, TimeUnit unit) {
        redisTemplate.opsForValue().set(BIKE_POINT_KEY_PREFIX + pointId, count, ttl, unit);
    }

    public void incrementBikeCount(Long pointId) {
        redisTemplate.opsForValue().increment(BIKE_POINT_KEY_PREFIX + pointId);
    }

    public void decrementBikeCount(Long pointId) {
        redisTemplate.opsForValue().decrement(BIKE_POINT_KEY_PREFIX + pointId);
    }

    public <T> void setObject(String key, T value) {
        redisTemplate.opsForValue().set(key, value);
    }

    public <T> void setObjectWithTTL(String key, T value, long ttl, TimeUnit unit) {
        redisTemplate.opsForValue().set(key, value, ttl, unit);
    }

    @SuppressWarnings("unchecked")
    public <T> T getObject(String key, Class<T> clazz) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) return null;
        if (clazz.isInstance(value)) return (T) value;
        return objectMapper.convertValue(value, clazz);
    }

    @SuppressWarnings("unchecked")
    public <T> List<T> getList(String key, Class<T> elementType) {
        Object value = redisTemplate.opsForValue().get(key);
        if (value == null) return null;
        TypeReference<List<T>> typeRef = new TypeReference<List<T>>() {};
        return objectMapper.convertValue(value, typeRef);
    }

    public void deleteKey(String key) {
        redisTemplate.delete(key);
    }

    public boolean hasKey(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }

    public <T> void hashPut(String hashKey, String field, T value) {
        try {
            redisTemplate.opsForHash().put(hashKey, field, value);
        } catch (Exception e) {
            log.error("Failed to put value to Redis Hash: {} - {}", hashKey, field, e);
        }
    }

    @SuppressWarnings("unchecked")
    public <T> T hashGet(String hashKey, String field, Class<T> clazz) {
        try {
            Object value = redisTemplate.opsForHash().get(hashKey, field);
            if (value == null) return null;
            if (clazz.isInstance(value)) return (T) value;
            return objectMapper.convertValue(value, clazz);
        } catch (Exception e) {
            log.warn("Failed to get value from Redis Hash: {} - {}", hashKey, field, e);
            return null;
        }
    }

    public Map<Object, Object> hashGetAll(String hashKey) {
        try {
            Map<Object, Object> all = redisTemplate.opsForHash().entries(hashKey);
            return all != null ? all : Collections.emptyMap();
        } catch (Exception e) {
            log.warn("Failed to get all from Redis Hash: {}", hashKey, e);
            return Collections.emptyMap();
        }
    }

    public void hashPutAll(String hashKey, Map<String, Object> map) {
        try {
            redisTemplate.opsForHash().putAll(hashKey, map);
        } catch (Exception e) {
            log.error("Failed to put all to Redis Hash: {}", hashKey, e);
        }
    }

    public void hashDelete(String hashKey, String... fields) {
        try {
            redisTemplate.opsForHash().delete(hashKey, (Object[]) fields);
        } catch (Exception e) {
            log.warn("Failed to delete from Redis Hash: {}", hashKey, e);
        }
    }

    public boolean hashHasKey(String hashKey, String field) {
        try {
            return Boolean.TRUE.equals(redisTemplate.opsForHash().hasKey(hashKey, field));
        } catch (Exception e) {
            log.warn("Failed to check hash key: {} - {}", hashKey, field, e);
            return false;
        }
    }

    public void setHashWithTTL(String hashKey, Map<String, Object> map, long ttl, TimeUnit unit) {
        try {
            redisTemplate.opsForHash().putAll(hashKey, map);
            redisTemplate.expire(hashKey, ttl, unit);
        } catch (Exception e) {
            log.error("Failed to set Redis Hash with TTL: {}", hashKey, e);
        }
    }
}
