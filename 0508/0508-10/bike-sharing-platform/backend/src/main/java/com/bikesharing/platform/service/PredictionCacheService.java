package com.bikesharing.platform.service;

import com.bikesharing.platform.config.CacheConfig;
import com.bikesharing.platform.dto.PredictionDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionCacheService {

    private final CacheManager cacheManager;
    private static final String CACHE_KEY_NEXT_2H = "next_2h";

    public List<PredictionDTO> getLocalCache() {
        try {
            Cache cache = cacheManager.getCache(CacheConfig.PREDICTION_CACHE);
            if (cache == null) {
                return null;
            }
            
            Cache.ValueWrapper wrapper = cache.get(CACHE_KEY_NEXT_2H);
            if (wrapper == null) {
                log.debug("Caffeine cache miss");
                return null;
            }
            
            Object value = wrapper.get();
            if (value instanceof List) {
                @SuppressWarnings("unchecked")
                List<PredictionDTO> result = (List<PredictionDTO>) value;
                log.debug("Caffeine cache hit: {} items", result.size());
                return result;
            }
        } catch (Exception e) {
            log.warn("Failed to read from Caffeine cache: {}", e.getMessage());
        }
        return null;
    }

    public void putLocalCache(List<PredictionDTO> predictions) {
        try {
            Cache cache = cacheManager.getCache(CacheConfig.PREDICTION_CACHE);
            if (cache != null) {
                cache.put(CACHE_KEY_NEXT_2H, predictions);
                log.debug("Caffeine cache updated: {} items", predictions.size());
            }
        } catch (Exception e) {
            log.warn("Failed to write to Caffeine cache: {}", e.getMessage());
        }
    }

    public void evictLocalCache() {
        try {
            Cache cache = cacheManager.getCache(CacheConfig.PREDICTION_CACHE);
            if (cache != null) {
                cache.evict(CACHE_KEY_NEXT_2H);
                log.debug("Caffeine cache evicted");
            }
        } catch (Exception e) {
            log.warn("Failed to evict Caffeine cache: {}", e.getMessage());
        }
    }
}
