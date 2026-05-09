package com.collabdocs.emotionaldocs.service;

import com.collabdocs.emotionaldocs.dto.ParagraphEditActivity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ParagraphActivityService {

    private final StringRedisTemplate stringRedisTemplate;
    private final ObjectMapper objectMapper;

    private static final String ACTIVITY_PREFIX = "activity:doc:";
    private static final String PARAGRAPH_PREFIX = "para:";
    private static final String USER_PREFIX = "user:";
    private static final long ACTIVITY_TTL_MINUTES = 5;

    private ObjectMapper getMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    private String getKey(Long docId, int paragraphIndex) {
        return ACTIVITY_PREFIX + docId + ":" + PARAGRAPH_PREFIX + paragraphIndex;
    }

    private String getUserField(Long userId) {
        return USER_PREFIX + userId;
    }

    public void recordEditActivity(Long docId, int paragraphIndex, Long userId, String username,
                                   Double sentimentScore, String emotion, String textHash) {
        String key = getKey(docId, paragraphIndex);
        String userField = getUserField(userId);

        ParagraphEditActivity activity = ParagraphEditActivity.builder()
                .docId(docId)
                .paragraphIndex(paragraphIndex)
                .userId(userId)
                .username(username)
                .sentimentScore(sentimentScore)
                .emotion(emotion)
                .timestamp(LocalDateTime.now())
                .textHash(textHash)
                .build();

        try {
            String json = getMapper().writeValueAsString(activity);
            stringRedisTemplate.opsForHash().put(key, userField, json);
            stringRedisTemplate.expire(key, ACTIVITY_TTL_MINUTES, TimeUnit.MINUTES);
            
            log.debug("Recorded edit activity: doc={}, para={}, user={}, score={}", 
                    docId, paragraphIndex, userId, sentimentScore);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize paragraph activity", e);
        }
    }

    public List<ParagraphEditActivity> getRecentActivities(Long docId, int paragraphIndex) {
        String key = getKey(docId, paragraphIndex);
        LocalDateTime threshold = LocalDateTime.now().minusMinutes(ACTIVITY_TTL_MINUTES);
        
        Map<Object, Object> entries = stringRedisTemplate.opsForHash().entries(key);
        List<ParagraphEditActivity> activities = new ArrayList<>();
        
        for (Map.Entry<Object, Object> entry : entries.entrySet()) {
            try {
                String json = (String) entry.getValue();
                ParagraphEditActivity activity = getMapper().readValue(json, ParagraphEditActivity.class);
                
                if (activity.getTimestamp().isAfter(threshold)) {
                    activities.add(activity);
                } else {
                    stringRedisTemplate.opsForHash().delete(key, entry.getKey());
                }
            } catch (JsonProcessingException e) {
                log.warn("Failed to deserialize paragraph activity", e);
            }
        }
        
        return activities;
    }

    public Map<Long, ParagraphEditActivity> getRecentActivitiesByUser(Long docId, int paragraphIndex) {
        List<ParagraphEditActivity> activities = getRecentActivities(docId, paragraphIndex);
        
        return activities.stream()
                .collect(Collectors.toMap(
                        ParagraphEditActivity::getUserId,
                        a -> a,
                        (existing, replacement) -> {
                            if (replacement.getTimestamp().isAfter(existing.getTimestamp())) {
                                return replacement;
                            }
                            return existing;
                        }
                ));
    }

    public List<Long> getRecentEditors(Long docId, int paragraphIndex) {
        return new ArrayList<>(getRecentActivitiesByUser(docId, paragraphIndex).keySet());
    }

    public void clearParagraphActivities(Long docId, int paragraphIndex) {
        String key = getKey(docId, paragraphIndex);
        stringRedisTemplate.delete(key);
    }

    public void clearAllDocumentActivities(Long docId) {
        String pattern = ACTIVITY_PREFIX + docId + ":*";
        Set<String> keys = stringRedisTemplate.keys(pattern);
        if (keys != null && !keys.isEmpty()) {
            stringRedisTemplate.delete(keys);
        }
    }
}
