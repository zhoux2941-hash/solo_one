package com.beekeeper.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class HealthScoreDTO {
    private Long beehiveId;
    private String hiveNumber;
    private Integer overallScore;
    private String level;
    private Double temperatureStabilityScore;
    private Double humidityAppropriatenessScore;
    private Double activityTrendScore;
    private String recommendation;
    private LocalDate calculationDate;
    private List<String> issues;
}
