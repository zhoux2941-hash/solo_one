package com.exoplanet.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PredictionResponse {

    private Double orbitalPeriod;
    private String orbitalPeriodDescription;

    private Double transitDuration;
    private String transitDurationDescription;

    private Double nextTransitTime;
    private String nextTransitTimeDescription;

    private Double semiMajorAxis;

    private Double impactParameter;

    private String habitabilityZone;

    private String predictionSummary;
}