package com.meteor.dto;

import lombok.Data;

@Data
public class VelocityEstimateResponse {
    
    private AngularInfo angular;
    private LinearInfo linear;
    private CalculationInfo calculation;
    
    @Data
    public static class AngularInfo {
        private Double distanceDegrees;
        private Double distanceArcminutes;
        private Double velocityDegreesPerSec;
        private Double velocityArcminutesPerSec;
    }
    
    @Data
    public static class LinearInfo {
        private Double velocityKmPerSec;
        private Double velocityKmPerHour;
        private Double velocityMetersPerSec;
        private Double minVelocityKmPerSec;
        private Double maxVelocityKmPerSec;
    }
    
    @Data
    public static class CalculationInfo {
        private Double pixelDistance;
        private Double exposureTimeSeconds;
        private Double meteorHeightKm;
        private Double distanceToMeteorKm;
    }
}
