package com.example.lostfound.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
public class HotItemService {

    private static final String HOT_KEYWORDS_KEY = "hot:keywords";
    private static final long EXPIRE_DAYS = 7;

    private final RedisTemplate<String, Object> redisTemplate;

    public void recordSearch(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return;
        String kw = keyword.trim().toLowerCase();
        redisTemplate.opsForZSet().incrementScore(HOT_KEYWORDS_KEY, kw, 1.0);
        redisTemplate.expire(HOT_KEYWORDS_KEY, EXPIRE_DAYS, TimeUnit.DAYS);
    }

    public void recordPublish(String itemName) {
        if (itemName == null || itemName.trim().isEmpty()) return;
        String name = itemName.trim().toLowerCase();
        redisTemplate.opsForZSet().incrementScore(HOT_KEYWORDS_KEY, name, 1.0);
        redisTemplate.expire(HOT_KEYWORDS_KEY, EXPIRE_DAYS, TimeUnit.DAYS);
    }

    public List<String> getTopKeywords(int topN) {
        Set<Object> keywords = redisTemplate.opsForZSet()
                .reverseRange(HOT_KEYWORDS_KEY, 0, topN - 1);
        List<String> result = new ArrayList<>();
        if (keywords != null) {
            for (Object kw : keywords) {
                result.add((String) kw);
            }
        }
        return result;
    }
}
