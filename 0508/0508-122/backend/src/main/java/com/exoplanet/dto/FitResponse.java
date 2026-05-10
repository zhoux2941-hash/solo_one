package com.exoplanet.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class FitResponse {

    private List<Double> time;
    private List<Double> observedFlux;
    private List<Double> fittedFlux;
    private Double chiSquared;
    private Double reducedChiSquared;
    private Double matchingDegree;
    private Double fittedPlanetRadius;
    private Double fittedInclination;
    private String shareToken;
}