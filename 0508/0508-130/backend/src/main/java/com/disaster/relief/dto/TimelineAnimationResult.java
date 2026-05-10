package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class TimelineAnimationResult {
    private List<TimelineFrame> frames;
    private List<TimelineEvent> events;
    private SupplyRequirement dailyConsumptionRate;
    private Integer simulationDays;
    private Map<String, ShortageInfo> shortages;
    private Integer totalDeliveries;
}
