package com.meteor.util;

public class MeteorVelocityCalculator {
    
    public static final double EARTH_RADIUS_KM = 6371.0;
    public static final double DEFAULT_METEOR_HEIGHT_KM = 100.0;
    public static final double MIN_METEOR_HEIGHT_KM = 70.0;
    public static final double MAX_METEOR_HEIGHT_KM = 130.0;
    
    public static VelocityResult calculateVelocity(
            double pixelDistance,
            int imageWidth,
            int imageHeight,
            double fieldOfViewDegrees,
            double frames,
            double fps,
            Double meteorHeightKm) {
        
        double heightKm = (meteorHeightKm != null) ? meteorHeightKm : DEFAULT_METEOR_HEIGHT_KM;
        heightKm = Math.max(MIN_METEOR_HEIGHT_KM, Math.min(MAX_METEOR_HEIGHT_KM, heightKm));
        
        double exposureTime = frames / fps;
        
        double angularDistanceDegrees = calculateAngularDistance(
                pixelDistance, imageWidth, imageHeight, fieldOfViewDegrees);
        
        double angularDistanceRadians = Math.toRadians(angularDistanceDegrees);
        
        double angularVelocityDegreesPerSec = angularDistanceDegrees / exposureTime;
        double angularVelocityRadiansPerSec = angularDistanceRadians / exposureTime;
        
        double distanceToMeteorKm = EARTH_RADIUS_KM + heightKm;
        
        double linearVelocityKmPerSec = angularVelocityRadiansPerSec * distanceToMeteorKm;
        double linearVelocityKmPerHour = linearVelocityKmPerSec * 3600.0;
        double linearVelocityMetersPerSec = linearVelocityKmPerSec * 1000.0;
        
        VelocityResult result = new VelocityResult();
        result.pixelDistance = pixelDistance;
        result.exposureTimeSeconds = exposureTime;
        result.angularDistanceDegrees = angularDistanceDegrees;
        result.angularDistanceArcminutes = angularDistanceDegrees * 60.0;
        result.angularVelocityDegreesPerSec = angularVelocityDegreesPerSec;
        result.angularVelocityArcminutesPerSec = angularVelocityDegreesPerSec * 60.0;
        result.meteorHeightKm = heightKm;
        result.distanceToMeteorKm = distanceToMeteorKm;
        result.linearVelocityKmPerSec = linearVelocityKmPerSec;
        result.linearVelocityKmPerHour = linearVelocityKmPerHour;
        result.linearVelocityMetersPerSec = linearVelocityMetersPerSec;
        
        result.minVelocityKmPerSec = calculateLinearVelocity(
                angularVelocityRadiansPerSec, EARTH_RADIUS_KM + MAX_METEOR_HEIGHT_KM);
        result.maxVelocityKmPerSec = calculateLinearVelocity(
                angularVelocityRadiansPerSec, EARTH_RADIUS_KM + MIN_METEOR_HEIGHT_KM);
        
        return result;
    }
    
    public static double calculateAngularDistance(
            double pixelDistance,
            int imageWidth,
            int imageHeight,
            double fieldOfViewDegrees) {
        
        double diagonalPixels = Math.sqrt(
                imageWidth * imageWidth + imageHeight * imageHeight);
        
        double degreesPerPixel = fieldOfViewDegrees / diagonalPixels;
        
        return pixelDistance * degreesPerPixel;
    }
    
    private static double calculateLinearVelocity(double angularVelocityRadPerSec, double distanceKm) {
        return angularVelocityRadPerSec * distanceKm;
    }
    
    public static class VelocityResult {
        public double pixelDistance;
        public double exposureTimeSeconds;
        public double angularDistanceDegrees;
        public double angularDistanceArcminutes;
        public double angularVelocityDegreesPerSec;
        public double angularVelocityArcminutesPerSec;
        public double meteorHeightKm;
        public double distanceToMeteorKm;
        public double linearVelocityKmPerSec;
        public double linearVelocityKmPerHour;
        public double linearVelocityMetersPerSec;
        public double minVelocityKmPerSec;
        public double maxVelocityKmPerSec;
    }
}
