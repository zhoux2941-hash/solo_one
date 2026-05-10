package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ForecastResponse {
    private Integer tentQuantity;
    private Integer waterQuantity;
    private Integer foodQuantity;
    private Integer medicalKitQuantity;
    private String disasterType;
    private Integer disasterIntensity;
    private Integer affectedPopulation;
}
