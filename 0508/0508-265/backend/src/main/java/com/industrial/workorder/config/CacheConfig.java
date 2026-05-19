package com.industrial.workorder.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

import java.util.concurrent.ConcurrentMap;

@Configuration
@EnableCaching
@EnableScheduling
public class CacheConfig {

    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager(
            "dailyStatistics",
            "dateRangeStatistics"
        );
        cacheManager.setAllowNullValues(false);
        return cacheManager;
    }

    @Scheduled(fixedRate = 300000)
    public void clearCachePeriodically() {
        CacheManager cacheManager = cacheManager();
        cacheManager.getCacheNames().forEach(cacheName -> {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null && cache.getNativeCache() instanceof ConcurrentMap) {
                ((ConcurrentMap<?, ?>) cache.getNativeCache()).clear();
            }
        });
    }
}
