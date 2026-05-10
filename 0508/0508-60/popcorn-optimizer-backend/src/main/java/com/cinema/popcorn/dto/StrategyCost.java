package com.cinema.popcorn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StrategyCost {
    private String strategyName;
    private double totalMinutes;
    private double warmupMinutes;
    private double runningMinutes;
    private double warmupEnergyKwh;
    private double runningEnergyKwh;
    private double totalEnergyKwh;
    private double totalCost;
}
