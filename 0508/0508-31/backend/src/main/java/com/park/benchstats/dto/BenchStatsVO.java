package com.park.benchstats.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BenchStatsVO {
    private Long benchId;
    private String benchCode;
    private String benchName;
    private String area;
    private String orientation;
    private LocalDate statDate;
    private Integer sunDurationMinutes;
    private Integer totalDaylightMinutes;
    private Double shadowPercentage;
    
    public Double getShadowPercent() {
        return validateShadowPercentage(this.shadowPercentage);
    }
    
    public Double getShadowPercentage() {
        return validateShadowPercentage(this.shadowPercentage);
    }
    
    private static Double validateShadowPercentage(Double value) {
        if (value == null) {
            return 0.0;
        }
        double clamped = Math.max(0.0, Math.min(100.0, value));
        return Math.round(clamped * 10.0) / 10.0;
    }
}
