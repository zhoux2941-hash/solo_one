package com.swimming.lanematcher.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_feedback")
public class UserFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "speed_history_id")
    private Long speedHistoryId;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "recommended_lane_id", nullable = false)
    private Integer recommendedLaneId;

    @Column(name = "actual_lane_id", nullable = false)
    private Integer actualLaneId;

    @Column(name = "speed", nullable = false)
    private Double speed;

    @Column(name = "is_match")
    private Boolean isMatch;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public UserFeedback() {
        this.createdAt = LocalDateTime.now();
    }

    public UserFeedback(Long speedHistoryId, String userId, Integer recommendedLaneId, Integer actualLaneId, Double speed) {
        this.speedHistoryId = speedHistoryId;
        this.userId = userId;
        this.recommendedLaneId = recommendedLaneId;
        this.actualLaneId = actualLaneId;
        this.speed = speed;
        this.isMatch = recommendedLaneId != null && recommendedLaneId.equals(actualLaneId);
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getSpeedHistoryId() {
        return speedHistoryId;
    }

    public void setSpeedHistoryId(Long speedHistoryId) {
        this.speedHistoryId = speedHistoryId;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Integer getRecommendedLaneId() {
        return recommendedLaneId;
    }

    public void setRecommendedLaneId(Integer recommendedLaneId) {
        this.recommendedLaneId = recommendedLaneId;
    }

    public Integer getActualLaneId() {
        return actualLaneId;
    }

    public void setActualLaneId(Integer actualLaneId) {
        this.actualLaneId = actualLaneId;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Boolean getIsMatch() {
        return isMatch;
    }

    public void setIsMatch(Boolean isMatch) {
        this.isMatch = isMatch;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}