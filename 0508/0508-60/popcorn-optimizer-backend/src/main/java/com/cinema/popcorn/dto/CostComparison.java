package com.cinema.popcorn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CostComparison {
    private StrategyCost advancedWarmup;
    private StrategyCost instantOn;
    private double savingsAmount;
    private double savingsPercentage;
    private String recommendation;
}
