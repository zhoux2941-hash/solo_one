package com.swimming.lanematcher.dto;

import jakarta.validation.constraints.NotNull;

public class FeedbackRequest {

    private Long historyId;

    private String userId;

    @NotNull(message = "推荐泳道ID不能为空")
    private Integer recommendedLaneId;

    @NotNull(message = "实际选择泳道ID不能为空")
    private Integer actualLaneId;

    @NotNull(message = "速度不能为空")
    private Double speed;

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
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
}