package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DailyConsumption {
    private Integer day;
    private Integer tentRemaining;
    private Integer waterRemaining;
    private Integer foodRemaining;
    private Integer medicalKitRemaining;
    private Integer tentConsumed;
    private Integer waterConsumed;
    private Integer foodConsumed;
    private Integer medicalKitConsumed;
}
