package com.swimming.lanematcher.dto;

import java.util.List;

public class RecommendationResponse {
    private Long historyId;
    private Integer recommendedLaneId;
    private String recommendedLaneName;
    private Double userSpeed;
    private String speedCategory;
    private List<LaneInfo> allLanes;
    private String message;

    public static class LaneInfo {
        private Integer id;
        private String name;
        private Double minSpeed;
        private Double maxSpeed;
        private Integer currentLoad;
        private Integer maxOccupancy;
        private String crowdLevel;
        private String crowdLevelClass;
        private Integer feedbackCount;
        private Boolean isRecommended;

        public Integer getId() {
            return id;
        }

        public void setId(Integer id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public Double getMinSpeed() {
            return minSpeed;
        }

        public void setMinSpeed(Double minSpeed) {
            this.minSpeed = minSpeed;
        }

        public Double getMaxSpeed() {
            return maxSpeed;
        }

        public void setMaxSpeed(Double maxSpeed) {
            this.maxSpeed = maxSpeed;
        }

        public Integer getCurrentLoad() {
            return currentLoad;
        }

        public void setCurrentLoad(Integer currentLoad) {
            this.currentLoad = currentLoad;
        }

        public Integer getMaxOccupancy() {
            return maxOccupancy;
        }

        public void setMaxOccupancy(Integer maxOccupancy) {
            this.maxOccupancy = maxOccupancy;
        }

        public String getCrowdLevel() {
            return crowdLevel;
        }

        public void setCrowdLevel(String crowdLevel) {
            this.crowdLevel = crowdLevel;
        }

        public String getCrowdLevelClass() {
            return crowdLevelClass;
        }

        public void setCrowdLevelClass(String crowdLevelClass) {
            this.crowdLevelClass = crowdLevelClass;
        }

        public Integer getFeedbackCount() {
            return feedbackCount;
        }

        public void setFeedbackCount(Integer feedbackCount) {
            this.feedbackCount = feedbackCount;
        }

        public Boolean getIsRecommended() {
            return isRecommended;
        }

        public void setIsRecommended(Boolean recommended) {
            isRecommended = recommended;
        }
    }

    public Long getHistoryId() {
        return historyId;
    }

    public void setHistoryId(Long historyId) {
        this.historyId = historyId;
    }

    public Integer getRecommendedLaneId() {
        return recommendedLaneId;
    }

    public void setRecommendedLaneId(Integer recommendedLaneId) {
        this.recommendedLaneId = recommendedLaneId;
    }

    public String getRecommendedLaneName() {
        return recommendedLaneName;
    }

    public void setRecommendedLaneName(String recommendedLaneName) {
        this.recommendedLaneName = recommendedLaneName;
    }

    public Double getUserSpeed() {
        return userSpeed;
    }

    public void setUserSpeed(Double userSpeed) {
        this.userSpeed = userSpeed;
    }

    public String getSpeedCategory() {
        return speedCategory;
    }

    public void setSpeedCategory(String speedCategory) {
        this.speedCategory = speedCategory;
    }

    public List<LaneInfo> getAllLanes() {
        return allLanes;
    }

    public void setAllLanes(List<LaneInfo> allLanes) {
        this.allLanes = allLanes;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}