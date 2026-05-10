package com.swimming.lanematcher.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lane_weight", uniqueConstraints = {
    @UniqueConstraint(columnNames = "lane_id")
})
public class LaneWeight {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "lane_id", nullable = false, unique = true)
    private Integer laneId;

    @Column(name = "base_weight", nullable = false)
    private Double baseWeight = 1.0;

    @Column(name = "feedback_weight", nullable = false)
    private Double feedbackWeight = 1.0;

    @Column(name = "total_weight", nullable = false)
    private Double totalWeight = 1.0;

    @Column(name = "match_count", nullable = false)
    private Integer matchCount = 0;

    @Column(name = "mismatch_count", nullable = false)
    private Integer mismatchCount = 0;

    @Column(name = "actual_selection_count", nullable = false)
    private Integer actualSelectionCount = 0;

    @Column(name = "recommendation_count", nullable = false)
    private Integer recommendationCount = 0;

    @Column(name = "speed_category")
    private String speedCategory;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    public LaneWeight() {
        this.lastUpdated = LocalDateTime.now();
    }

    public LaneWeight(Integer laneId) {
        this.laneId = laneId;
        this.baseWeight = 1.0;
        this.feedbackWeight = 1.0;
        this.totalWeight = 1.0;
        this.matchCount = 0;
        this.mismatchCount = 0;
        this.actualSelectionCount = 0;
        this.recommendationCount = 0;
        this.lastUpdated = LocalDateTime.now();
    }

    public void recalculateTotalWeight() {
        double feedbackBonus = 1.0 + (actualSelectionCount * 0.1);
        double matchBonus = matchCount > 0 ? 1.0 + (matchCount * 0.05) : 1.0;
        double mismatchPenalty = mismatchCount > 0 ? 1.0 - (mismatchCount * 0.02) : 1.0;
        mismatchPenalty = Math.max(0.5, mismatchPenalty);
        
        this.feedbackWeight = feedbackBonus * matchBonus * mismatchPenalty;
        this.totalWeight = this.baseWeight * this.feedbackWeight;
        this.lastUpdated = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getLaneId() {
        return laneId;
    }

    public void setLaneId(Integer laneId) {
        this.laneId = laneId;
    }

    public Double getBaseWeight() {
        return baseWeight;
    }

    public void setBaseWeight(Double baseWeight) {
        this.baseWeight = baseWeight;
    }

    public Double getFeedbackWeight() {
        return feedbackWeight;
    }

    public void setFeedbackWeight(Double feedbackWeight) {
        this.feedbackWeight = feedbackWeight;
    }

    public Double getTotalWeight() {
        return totalWeight;
    }

    public void setTotalWeight(Double totalWeight) {
        this.totalWeight = totalWeight;
    }

    public Integer getMatchCount() {
        return matchCount;
    }

    public void setMatchCount(Integer matchCount) {
        this.matchCount = matchCount;
    }

    public Integer getMismatchCount() {
        return mismatchCount;
    }

    public void setMismatchCount(Integer mismatchCount) {
        this.mismatchCount = mismatchCount;
    }

    public Integer getActualSelectionCount() {
        return actualSelectionCount;
    }

    public void setActualSelectionCount(Integer actualSelectionCount) {
        this.actualSelectionCount = actualSelectionCount;
    }

    public Integer getRecommendationCount() {
        return recommendationCount;
    }

    public void setRecommendationCount(Integer recommendationCount) {
        this.recommendationCount = recommendationCount;
    }

    public String getSpeedCategory() {
        return speedCategory;
    }

    public void setSpeedCategory(String speedCategory) {
        this.speedCategory = speedCategory;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}