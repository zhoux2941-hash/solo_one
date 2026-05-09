package com.bikesharing.platform.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.concurrent.TimeUnit;

@Configuration
@EnableCaching
public class CacheConfig {

    public static final String PREDICTION_CACHE = "predictionCache";
    public static final String HOURLY_DEMAND_CACHE = "hourlyDemandCache";

    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .initialCapacity(100)
                .maximumSize(500)
                .expireAfterWrite(20, TimeUnit.MINUTES)
                .recordStats());
        
        cacheManager.setCacheNames(java.util.Arrays.asList(
                PREDICTION_CACHE,
                HOURLY_DEMAND_CACHE
        ));
        
        return cacheManager;
    }
}
