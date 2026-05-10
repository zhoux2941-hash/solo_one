package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ConsumptionResult {
    private List<DailyConsumption> dailyConsumptions;
    private Map<String, ShortageInfo> shortages;
    private Integer simulationDays;
    private SupplyRequirement dailyConsumptionRate;
}
