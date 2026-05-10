package com.disaster.relief.dto;

import lombok.Data;
import java.util.List;

@Data
public class TimelineAnimationRequest {
    private Integer affectedPopulation;
    private SupplyRequirement initialStock;
    private Integer simulationDays = 30;
    private Double consumptionRateMultiplier = 1.0;
    private List<SupplyDelivery> scheduledDeliveries;
}
