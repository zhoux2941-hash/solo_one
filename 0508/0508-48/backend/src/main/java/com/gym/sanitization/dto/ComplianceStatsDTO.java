package com.gym.sanitization.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplianceStatsDTO {
    private Integer onTimeCount;
    private Integer overdueCount;
    private Integer totalCount;
    private Double complianceRate;
    private String timePeriod;
}
