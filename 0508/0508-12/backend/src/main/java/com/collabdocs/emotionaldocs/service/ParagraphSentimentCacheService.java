package com.collabdocs.emotionaldocs.service;

import com.collabdocs.emotionaldocs.dto.ParagraphCacheData;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.codec.digest.DigestUtils;
import org.springframework.data.redis.core.HashOperations;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParagraphSentimentCacheService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String CACHE_PREFIX = "sentiment:doc:";
    private static final String PARAGRAPH_PREFIX = "para:";
    private static final String HASH_FIELD_TEXT = "textHash";
    private static final String HASH_FIELD_SCORE = "score";
    private static final String HASH_FIELD_EMOTION = "emotion";
    private static final String HASH_FIELD_POSITIVE = "positive";
    private static final String HASH_FIELD_NEGATIVE = "negative";
    private static final String HASH_FIELD_NEUTRAL = "neutral";
    private static final String HASH_FIELD_WORDS = "wordCount";
    private static final String HASH_FIELD_TIMESTAMP = "timestamp";

    private static final long CACHE_TTL_HOURS = 24;

    public String getDocCacheKey(Long docId) {
        return CACHE_PREFIX + docId;
    }

    public String getParagraphHashKey(int paraIndex) {
        return PARAGRAPH_PREFIX + paraIndex;
    }

    public String calculateTextHash(String text) {
        if (text == null || text.isEmpty()) {
            return "";
        }
        return DigestUtils.md5Hex(text.trim());
    }

    public void cacheParagraphSentiment(Long docId, int paraIndex, ParagraphCacheData data) {
        String cacheKey = getDocCacheKey(docId);
        String paraKey = getParagraphHashKey(paraIndex);

        try {
            Map<String, String> hashData = new HashMap<>();
            hashData.put(HASH_FIELD_TEXT, data.getTextHash());
            hashData.put(HASH_FIELD_SCORE, String.valueOf(data.getSentimentScore()));
            hashData.put(HASH_FIELD_EMOTION, data.getEmotion());
            hashData.put(HASH_FIELD_POSITIVE, String.valueOf(data.getPositiveScore()));
            hashData.put(HASH_FIELD_NEGATIVE, String.valueOf(data.getNegativeScore()));
            hashData.put(HASH_FIELD_NEUTRAL, String.valueOf(data.getNeutralScore()));
            hashData.put(HASH_FIELD_WORDS, String.valueOf(data.getWordCount()));
            hashData.put(HASH_FIELD_TIMESTAMP, String.valueOf(System.currentTimeMillis()));

            HashOperations<String, String, String> hashOps = stringRedisTemplate.opsForHash();
            hashOps.putAll(cacheKey + ":" + paraKey, hashData);

            stringRedisTemplate.expire(cacheKey + ":" + paraKey, CACHE_TTL_HOURS, TimeUnit.HOURS);

            log.debug("Cached paragraph {} for doc {}: score={}", paraIndex, docId, data.getSentimentScore());
        } catch (Exception e) {
            log.warn("Failed to cache paragraph sentiment for doc {} para {}", docId, paraIndex, e);
        }
    }

    public ParagraphCacheData getCachedParagraph(Long docId, int paraIndex, String currentTextHash) {
        String cacheKey = getDocCacheKey(docId);
        String paraKey = getParagraphHashKey(paraIndex);

        try {
            HashOperations<String, String, String> hashOps = stringRedisTemplate.opsForHash();
            Map<String, String> cached = hashOps.entries(cacheKey + ":" + paraKey);

            if (cached == null || cached.isEmpty()) {
                return null;
            }

            String cachedHash = cached.get(HASH_FIELD_TEXT);
            if (!Objects.equals(cachedHash, currentTextHash)) {
                log.debug("Cache miss for paragraph {} - content changed", paraIndex);
                return null;
            }

            return ParagraphCacheData.builder()
                    .paragraphIndex(paraIndex)
                    .textHash(cachedHash)
                    .sentimentScore(Double.parseDouble(cached.getOrDefault(HASH_FIELD_SCORE, "0.0")))
                    .emotion(cached.get(HASH_FIELD_EMOTION))
                    .positiveScore(Double.parseDouble(cached.getOrDefault(HASH_FIELD_POSITIVE, "0.0")))
                    .negativeScore(Double.parseDouble(cached.getOrDefault(HASH_FIELD_NEGATIVE, "0.0")))
                    .neutralScore(Double.parseDouble(cached.getOrDefault(HASH_FIELD_NEUTRAL, "0.0")))
                    .wordCount(Integer.parseInt(cached.getOrDefault(HASH_FIELD_WORDS, "0")))
                    .timestamp(Long.parseLong(cached.getOrDefault(HASH_FIELD_TIMESTAMP, "0")))
                    .build();

        } catch (Exception e) {
            log.warn("Failed to get cached paragraph for doc {} para {}", docId, paraIndex, e);
            return null;
        }
    }

    public List<ParagraphCacheData> getAllCachedParagraphs(Long docId, List<String> paragraphHashes) {
        List<ParagraphCacheData> result = new ArrayList<>();

        for (int i = 0; i < paragraphHashes.size(); i++) {
            ParagraphCacheData cached = getCachedParagraph(docId, i, paragraphHashes.get(i));
            if (cached != null) {
                result.add(cached);
            }
        }

        return result;
    }

    public void clearCache(Long docId) {
        try {
            String pattern = getDocCacheKey(docId) + ":*";
            Set<String> keys = stringRedisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                stringRedisTemplate.delete(keys);
                log.info("Cleared {} cache keys for doc {}", keys.size(), docId);
            }
        } catch (Exception e) {
            log.warn("Failed to clear cache for doc {}", docId, e);
        }
    }

    public void removeParagraphCache(Long docId, int paraIndex) {
        try {
            String cacheKey = getDocCacheKey(docId);
            String paraKey = getParagraphHashKey(paraIndex);
            stringRedisTemplate.delete(cacheKey + ":" + paraKey);
        } catch (Exception e) {
            log.warn("Failed to remove paragraph cache for doc {} para {}", docId, paraIndex, e);
        }
    }

    public Map<Integer, ParagraphCacheData> getCacheMap(Long docId, List<String> paragraphs) {
        Map<Integer, ParagraphCacheData> cacheMap = new HashMap<>();

        for (int i = 0; i < paragraphs.size(); i++) {
            String textHash = calculateTextHash(paragraphs.get(i));
            ParagraphCacheData cached = getCachedParagraph(docId, i, textHash);
            if (cached != null) {
                cacheMap.put(i, cached);
            }
        }

        return cacheMap;
    }
}
