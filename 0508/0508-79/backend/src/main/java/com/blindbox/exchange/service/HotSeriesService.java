package com.blindbox.exchange.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class HotSeriesService {

    private final RedisTemplate<String, Object> redisTemplate;
    private static final String HOT_SERIES_KEY = "hot:series";
    private static final int HOT_EXPIRE_DAYS = 1;

    public void incrementSeriesView(String seriesName) {
        redisTemplate.opsForZSet().incrementScore(HOT_SERIES_KEY, seriesName, 1);
        redisTemplate.expire(HOT_SERIES_KEY, HOT_EXPIRE_DAYS, TimeUnit.DAYS);
    }

    public List<String> getTopHotSeries(int limit) {
        Set<Object> series = redisTemplate.opsForZSet()
                .reverseRange(HOT_SERIES_KEY, 0, limit - 1);
        if (series == null) {
            return Collections.emptyList();
        }
        return series.stream()
                .map(Object::toString)
                .collect(Collectors.toList());
    }

    public Map<String, Double> getTopHotSeriesWithScore(int limit) {
        Set<org.springframework.data.redis.core.ZSetOperations.TypedTuple<Object>> tuples = 
                redisTemplate.opsForZSet().reverseRangeWithScores(HOT_SERIES_KEY, 0, limit - 1);
        if (tuples == null) {
            return Collections.emptyMap();
        }
        Map<String, Double> result = new LinkedHashMap<>();
        for (org.springframework.data.redis.core.ZSetOperations.TypedTuple<Object> tuple : tuples) {
            if (tuple.getValue() != null && tuple.getScore() != null) {
                result.put(tuple.getValue().toString(), tuple.getScore());
            }
        }
        return result;
    }
}
