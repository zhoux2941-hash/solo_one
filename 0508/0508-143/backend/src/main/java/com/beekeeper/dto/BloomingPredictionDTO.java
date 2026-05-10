package com.beekeeper.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class BloomingPredictionDTO {
    private Long nectarSourceId;
    private String nectarSourceName;
    private String season;
    private Double requiredDegreeDays;
    private Double accumulatedDegreeDays;
    private Double remainingDegreeDays;
    private LocalDate predictedStartDate;
    private LocalDate predictedEndDate;
    private Double progress;
    private String status;
}
