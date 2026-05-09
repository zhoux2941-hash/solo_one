package com.park.benchstats.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.park.benchstats.dto.BenchStatsVO;
import com.park.benchstats.enums.WeatherType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class WeatherCacheService {
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);
    private static final String CACHE_KEY_PREFIX = "bench:stats:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private String buildCacheKey(LocalDate date, WeatherType weather) {
        return CACHE_KEY_PREFIX + date.toString() + ":" + weather.getCode();
    }

    public Optional<List<BenchStatsVO>> getCachedStats(LocalDate date, WeatherType weather) {
        try {
            String key = buildCacheKey(date, weather);
            String cached = redisTemplate.opsForValue().get(key);
            if (cached != null) {
                log.debug("Cache hit for key: {}", key);
                List<BenchStatsVO> stats = objectMapper.readValue(cached, 
                    new TypeReference<List<BenchStatsVO>>() {});
                return Optional.of(stats);
            }
        } catch (Exception e) {
            log.warn("Failed to read from cache: {}", e.getMessage());
        }
        return Optional.empty();
    }

    public void cacheStats(LocalDate date, WeatherType weather, List<BenchStatsVO> stats) {
        try {
            String key = buildCacheKey(date, weather);
            String json = objectMapper.writeValueAsString(stats);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL);
            log.debug("Cached stats for key: {}, TTL: {}s", key, CACHE_TTL.getSeconds());
        } catch (Exception e) {
            log.warn("Failed to write to cache: {}", e.getMessage());
        }
    }

    public void evictCache(LocalDate date) {
        try {
            for (WeatherType weather : WeatherType.values()) {
                String key = buildCacheKey(date, weather);
                redisTemplate.delete(key);
            }
            log.debug("Evicted all cache for date: {}", date);
        } catch (Exception e) {
            log.warn("Failed to evict cache: {}", e.getMessage());
        }
    }

    public Map<String, Object> getCacheInfo(LocalDate date) {
        try {
            Map<String, Object> info = new java.util.HashMap<>();
            for (WeatherType weather : WeatherType.values()) {
                String key = buildCacheKey(date, weather);
                String cached = redisTemplate.opsForValue().get(key);
                info.put(weather.getCode(), cached != null ? "cached" : "not cached");
            }
            return info;
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }
}
