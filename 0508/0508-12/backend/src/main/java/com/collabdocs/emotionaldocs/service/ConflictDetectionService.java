package com.collabdocs.emotionaldocs.service;

import com.collabdocs.emotionaldocs.dto.ConflictAlertMessage;
import com.collabdocs.emotionaldocs.dto.ParagraphEditActivity;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConflictDetectionService {

    private final ParagraphActivityService paragraphActivityService;
    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate stringRedisTemplate;

    private static final double SCORE_DIFFERENCE_THRESHOLD = 0.5;
    private static final String ALERT_DEDUPE_PREFIX = "alert:dedupe:";
    private static final long ALERT_DEDUPE_MINUTES = 2;

    private ObjectMapper getMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        return mapper;
    }

    private String getDedupeKey(Long docId, int paragraphIndex, Long userId1, Long userId2) {
        long minId = Math.min(userId1, userId2);
        long maxId = Math.max(userId1, userId2);
        return ALERT_DEDUPE_PREFIX + docId + ":" + paragraphIndex + ":" + minId + "-" + maxId;
    }

    private boolean shouldDedupe(Long docId, int paragraphIndex, Long userId1, Long userId2) {
        String key = getDedupeKey(docId, paragraphIndex, userId1, userId2);
        Boolean exists = stringRedisTemplate.hasKey(key);
        return Boolean.TRUE.equals(exists);
    }

    private void markAlertSent(Long docId, int paragraphIndex, Long userId1, Long userId2) {
        String key = getDedupeKey(docId, paragraphIndex, userId1, userId2);
        stringRedisTemplate.opsForValue().set(key, "1", ALERT_DEDUPE_MINUTES, TimeUnit.MINUTES);
    }

    public Optional<ConflictAlertMessage> detectConflict(Long docId, int paragraphIndex, 
                                                          Long currentUserId, String currentUserName,
                                                          Double currentScore, String currentEmotion) {
        Map<Long, ParagraphEditActivity> recentActivities = 
                paragraphActivityService.getRecentActivitiesByUser(docId, paragraphIndex);

        for (Map.Entry<Long, ParagraphEditActivity> entry : recentActivities.entrySet()) {
            Long otherUserId = entry.getKey();
            ParagraphEditActivity otherActivity = entry.getValue();

            if (otherUserId.equals(currentUserId)) {
                continue;
            }

            Double otherScore = otherActivity.getSentimentScore();
            if (otherScore == null) {
                continue;
            }

            double scoreDiff = Math.abs(currentScore - otherScore);

            if (scoreDiff > SCORE_DIFFERENCE_THRESHOLD) {
                log.info("Conflict detected! doc={}, para={}, users={}-{}, scores={}-{}, diff={}",
                        docId, paragraphIndex, currentUserId, otherUserId, 
                        currentScore, otherScore, scoreDiff);

                if (shouldDedupe(docId, paragraphIndex, currentUserId, otherUserId)) {
                    log.debug("Alert already sent recently, skipping");
                    continue;
                }

                ConflictAlertMessage alert = buildAlert(
                        docId, paragraphIndex,
                        currentUserId, currentUserName, currentScore, currentEmotion,
                        otherUserId, otherActivity.getUsername(), 
                        otherScore, otherActivity.getEmotion(),
                        scoreDiff
                );

                markAlertSent(docId, paragraphIndex, currentUserId, otherUserId);
                
                return Optional.of(alert);
            }
        }

        return Optional.empty();
    }

    public void broadcastConflictAlert(ConflictAlertMessage alert) {
        try {
            String topic = "/topic/documents/" + alert.getDocId() + "/alerts";
            String json = getMapper().writeValueAsString(alert);
            
            log.info("Broadcasting conflict alert to {}: {}", topic, alert.getMessage());
            messagingTemplate.convertAndSend(topic, json);
            
        } catch (JsonProcessingException e) {
            log.error("Failed to serialize conflict alert", e);
        }
    }

    private ConflictAlertMessage buildAlert(
            Long docId, int paragraphIndex,
            Long currentUserId, String currentUserName, 
            Double currentScore, String currentEmotion,
            Long otherUserId, String otherUserName,
            Double otherScore, String otherEmotion,
            double scoreDiff) {

        String emotion1Text = getEmotionText(currentEmotion);
        String emotion2Text = getEmotionText(otherEmotion);
        String otherName = (otherUserName != null && !otherUserName.isEmpty()) 
                ? otherUserName : "协作者";

        String message = String.format(
                "请注意，您（%s，态度：%s）和%s（态度：%s）对该段落的态度可能不一致（情感差异：%.2f），建议沟通。",
                currentUserName != null ? currentUserName : "您",
                emotion1Text,
                otherName,
                emotion2Text,
                scoreDiff
        );

        return ConflictAlertMessage.builder()
                .alertId(UUID.randomUUID().toString())
                .docId(docId)
                .paragraphIndex(paragraphIndex)
                .currentUserId(currentUserId)
                .currentUserName(currentUserName)
                .currentUserScore(currentScore)
                .currentUserEmotion(currentEmotion)
                .otherUserId(otherUserId)
                .otherUserName(otherUserName)
                .otherUserScore(otherScore)
                .otherUserEmotion(otherEmotion)
                .scoreDifference(scoreDiff)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    private String getEmotionText(String emotion) {
        if (emotion == null) return "中立";
        switch (emotion.toUpperCase()) {
            case "POSITIVE":
                return "积极 😊";
            case "NEGATIVE":
                return "消极 😢";
            default:
                return "中立 😐";
        }
    }

    public void detectAndBroadcast(Long docId, int paragraphIndex,
                                    Long currentUserId, String currentUserName,
                                    Double currentScore, String currentEmotion) {
        Optional<ConflictAlertMessage> alertOpt = detectConflict(
                docId, paragraphIndex,
                currentUserId, currentUserName,
                currentScore, currentEmotion
        );

        alertOpt.ifPresent(this::broadcastConflictAlert);
    }
}
