package com.wheelchair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WearPredictionResponse implements Serializable {
    private static final long serialVersionUID = 1L;
    
    private String wheelchairId;
    private List<HistoricalData> historicalData;
    private List<PredictionData> predictionData;
    private RegressionMetrics regressionMetrics;
    private LocalDate generatedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class HistoricalData implements Serializable {
        private static final long serialVersionUID = 1L;
        private LocalDate date;
        private Integer wearValue;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PredictionData implements Serializable {
        private static final long serialVersionUID = 1L;
        private LocalDate date;
        private Double predictedWear;
        private Double lowerBound;
        private Double upperBound;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegressionMetrics implements Serializable {
        private static final long serialVersionUID = 1L;
        private Double slope;
        private Double intercept;
        private Double r2;
        private Double dailyTrend;
    }
}
