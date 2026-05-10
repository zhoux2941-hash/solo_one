package com.exoplanet.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

@Data
@Builder
public class TransitResponse {

    private List<Double> time;
    private List<Double> flux;
    private List<Double> fluxWithNoise;
    private Double transitDepth;
    private Double transitDuration;
    private String starType;
}