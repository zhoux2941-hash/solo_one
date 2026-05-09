package com.collabdocs.emotionaldocs.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SentimentHistoryResponse {
    private Long docId;
    private List<UserSentimentSeries> series;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserSentimentSeries {
        private Long userId;
        private String username;
        private String color;
        private List<SentimentPoint> points;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SentimentPoint {
        private LocalDateTime timestamp;
        private double score;
        private String emotion;
    }
}
