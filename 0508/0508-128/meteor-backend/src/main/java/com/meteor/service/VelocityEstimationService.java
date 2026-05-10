package com.meteor.service;

import com.meteor.dto.VelocityEstimateRequest;
import com.meteor.dto.VelocityEstimateResponse;
import com.meteor.util.MeteorVelocityCalculator;
import org.springframework.stereotype.Service;

@Service
public class VelocityEstimationService {
    
    public VelocityEstimateResponse estimateVelocity(VelocityEstimateRequest request) {
        validateRequest(request);
        
        double pixelDistance = calculatePixelDistance(request);
        
        MeteorVelocityCalculator.VelocityResult result = MeteorVelocityCalculator.calculateVelocity(
                pixelDistance,
                request.getImageWidth(),
                request.getImageHeight(),
                request.getFieldOfViewDegrees(),
                request.getFrames().doubleValue(),
                request.getFps(),
                request.getMeteorHeightKm()
        );
        
        return convertToResponse(result);
    }
    
    private void validateRequest(VelocityEstimateRequest request) {
        if (request.getImageWidth() == null || request.getImageWidth() <= 0) {
            throw new IllegalArgumentException("图片宽度必须大于0");
        }
        if (request.getImageHeight() == null || request.getImageHeight() <= 0) {
            throw new IllegalArgumentException("图片高度必须大于0");
        }
        if (request.getFieldOfViewDegrees() == null || request.getFieldOfViewDegrees() <= 0) {
            throw new IllegalArgumentException("视场角必须大于0");
        }
        if (request.getFrames() == null || request.getFrames() <= 0) {
            throw new IllegalArgumentException("帧数必须大于0");
        }
        if (request.getFps() == null || request.getFps() <= 0) {
            throw new IllegalArgumentException("帧率必须大于0");
        }
        
        if (request.getPixelDistance() == null && 
            (request.getStartPixelX() == null || request.getEndPixelX() == null)) {
            throw new IllegalArgumentException("必须提供像素距离或起点/终点坐标");
        }
    }
    
    private double calculatePixelDistance(VelocityEstimateRequest request) {
        if (request.getPixelDistance() != null && request.getPixelDistance() > 0) {
            return request.getPixelDistance();
        }
        
        int dx = request.getEndPixelX() - request.getStartPixelX();
        int dy = request.getEndPixelY() - request.getStartPixelY();
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    private VelocityEstimateResponse convertToResponse(MeteorVelocityCalculator.VelocityResult result) {
        VelocityEstimateResponse response = new VelocityEstimateResponse();
        
        VelocityEstimateResponse.AngularInfo angular = new VelocityEstimateResponse.AngularInfo();
        angular.setDistanceDegrees(roundTo4(result.angularDistanceDegrees));
        angular.setDistanceArcminutes(roundTo4(result.angularDistanceArcminutes));
        angular.setVelocityDegreesPerSec(roundTo4(result.angularVelocityDegreesPerSec));
        angular.setVelocityArcminutesPerSec(roundTo4(result.angularVelocityArcminutesPerSec));
        response.setAngular(angular);
        
        VelocityEstimateResponse.LinearInfo linear = new VelocityEstimateResponse.LinearInfo();
        linear.setVelocityKmPerSec(roundTo2(result.linearVelocityKmPerSec));
        linear.setVelocityKmPerHour(roundTo2(result.linearVelocityKmPerHour));
        linear.setVelocityMetersPerSec(roundTo2(result.linearVelocityMetersPerSec));
        linear.setMinVelocityKmPerSec(roundTo2(result.minVelocityKmPerSec));
        linear.setMaxVelocityKmPerSec(roundTo2(result.maxVelocityKmPerSec));
        response.setLinear(linear);
        
        VelocityEstimateResponse.CalculationInfo calc = new VelocityEstimateResponse.CalculationInfo();
        calc.setPixelDistance(roundTo2(result.pixelDistance));
        calc.setExposureTimeSeconds(roundTo4(result.exposureTimeSeconds));
        calc.setMeteorHeightKm(roundTo2(result.meteorHeightKm));
        calc.setDistanceToMeteorKm(roundTo2(result.distanceToMeteorKm));
        response.setCalculation(calc);
        
        return response;
    }
    
    private double roundTo2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
    
    private double roundTo4(double value) {
        return Math.round(value * 10000.0) / 10000.0;
    }
}
