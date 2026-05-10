package com.swimming.lanematcher.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "speed_history")
public class SpeedHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id")
    private String userId;

    @Column(name = "speed", nullable = false)
    private Double speed;

    @Column(name = "recommended_lane_id")
    private Integer recommendedLaneId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public SpeedHistory() {
        this.createdAt = LocalDateTime.now();
    }

    public SpeedHistory(String userId, Double speed, Integer recommendedLaneId) {
        this.userId = userId;
        this.speed = speed;
        this.recommendedLaneId = recommendedLaneId;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Double getSpeed() {
        return speed;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public Integer getRecommendedLaneId() {
        return recommendedLaneId;
    }

    public void setRecommendedLaneId(Integer recommendedLaneId) {
        this.recommendedLaneId = recommendedLaneId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}