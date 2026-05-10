package com.disaster.relief.dto;

import lombok.Data;

@Data
public class ConsumptionRequest {
    private Integer affectedPopulation;
    private SupplyRequirement initialStock;
    private Integer simulationDays = 30;
    private Double consumptionRateMultiplier = 1.0;
}
