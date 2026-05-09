package com.blindpath.monitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WearPredictionDTO {
    private List<PredictionPoint> predictions;
    private String predictionDate;
    private String modelUsed;
    private Integer daysPredicted;
    private Integer historicalDaysUsed;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionPoint {
        private Integer distance;
        private Double predictedWear;
        private List<Double> dailyPredictions;
        private Double trend;
    }
}
