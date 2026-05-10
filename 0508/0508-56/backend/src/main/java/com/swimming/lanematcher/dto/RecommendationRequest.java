package com.swimming.lanematcher.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public class RecommendationRequest {

    private String userId;

    @NotNull(message = "速度不能为空")
    @Positive(message = "速度必须为正数")
    private Double speed;

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
}