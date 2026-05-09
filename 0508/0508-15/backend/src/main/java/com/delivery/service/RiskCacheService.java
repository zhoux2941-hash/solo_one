package com.delivery.service;

import com.delivery.dto.RiderLocationDTO;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class RiskCacheService {

    private final RedisTemplate<String, Object> redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String RISK_CACHE_KEY = "dispatch:risk:cache";

    public void cacheRiskData(List<RiderLocationDTO> data) {
        try {
            String json = objectMapper.writeValueAsString(data);
            redisTemplate.opsForValue().set(RISK_CACHE_KEY, json);
            log.info("Cached {} rider risk entries to Redis", data.size());
        } catch (JsonProcessingException e) {
            log.error("Failed to cache risk data", e);
        }
    }

    public List<RiderLocationDTO> getCachedRiskData() {
        Object value = redisTemplate.opsForValue().get(RISK_CACHE_KEY);
        if (value == null) {
            return Collections.emptyList();
        }

        try {
            String json = value.toString();
            return objectMapper.readValue(json, new TypeReference<List<RiderLocationDTO>>() {});
        } catch (JsonProcessingException e) {
            log.error("Failed to deserialize cached risk data", e);
            return Collections.emptyList();
        }
    }

    public boolean hasCache() {
        return Boolean.TRUE.equals(redisTemplate.hasKey(RISK_CACHE_KEY));
    }
}
