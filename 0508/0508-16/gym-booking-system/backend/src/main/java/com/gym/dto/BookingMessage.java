package com.gym.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingMessage {
    
    private String messageId;
    private Long userId;
    private String userName;
    private Long courseId;
    private Integer capacity;
    private LocalDateTime bookTime;
    private LocalDateTime expireTime;
    private Integer retryCount;
    
    public static BookingMessage create(Long userId, String userName, Long courseId, Integer capacity) {
        return BookingMessage.builder()
                .messageId(UUID.randomUUID().toString())
                .userId(userId)
                .userName(userName)
                .courseId(courseId)
                .capacity(capacity)
                .bookTime(LocalDateTime.now())
                .expireTime(LocalDateTime.now().plusMinutes(30))
                .retryCount(0)
                .build();
    }
    
    public void incrementRetryCount() {
        if (this.retryCount == null) {
            this.retryCount = 0;
        }
        this.retryCount++;
    }
    
    public boolean shouldRetry() {
        return this.retryCount == null || this.retryCount < 3;
    }
    
    public boolean isExpired() {
        return this.expireTime != null && LocalDateTime.now().isAfter(this.expireTime);
    }
}
