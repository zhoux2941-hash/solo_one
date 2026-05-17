package com.balistics.service;

import com.balistics.entity.BallisticsResult;
import com.balistics.entity.WeatherData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BallisticsDragService {
    
    @Autowired
    private AirDensityService airDensityService;
    
    private static final double BULLET_MASS = 0.01;
    private static final double BULLET_DIAMETER = 0.00782;
    private static final double INITIAL_VELOCITY = 900;
    private static final double DRAG_COEFFICIENT = 0.295;
    private static final double STANDARD_AIR_DENSITY = 1.225;
    private static final double RANGE = 1000;
    
    public BallisticsResult calculateBallistics(WeatherData weatherData) {
        BallisticsResult result = new BallisticsResult();
        result.setWeatherData(weatherData);
        
        double airDensity = airDensityService.calculateAirDensity(weatherData);
        result.setAirDensity(airDensity);
        
        double densityRatio = airDensity / STANDARD_AIR_DENSITY;
        result.setDragCorrectionFactor(densityRatio);
        
        double adjustedDragCoefficient = DRAG_COEFFICIENT * densityRatio;
        result.setDragCoefficient(Math.round(adjustedDragCoefficient * 10000.0) / 10000.0);
        
        double crossSectionalArea = Math.PI * Math.pow(BULLET_DIAMETER / 2, 2);
        double dragForce = 0.5 * airDensity * crossSectionalArea * 
                          adjustedDragCoefficient * Math.pow(INITIAL_VELOCITY, 2);
        result.setDragForce(Math.round(dragForce * 100.0) / 100.0);
        
        double timeOfFlight = calculateTimeOfFlight(airDensity);
        result.setTimeOfFlight(Math.round(timeOfFlight * 1000.0) / 1000.0);
        
        double bulletDrop = calculateBulletDrop(airDensity, timeOfFlight);
        result.setBulletDrop(Math.round(bulletDrop * 100.0) / 100.0);
        
        double remainingVelocity = calculateRemainingVelocity(airDensity);
        result.setRemainingVelocity(Math.round(remainingVelocity * 100.0) / 100.0);
        
        double velocityDrop = INITIAL_VELOCITY - remainingVelocity;
        result.setVelocityDrop(Math.round(velocityDrop * 100.0) / 100.0);
        
        result.setClimateType(determineClimateType(weatherData));
        
        return result;
    }
    
    private double calculateTimeOfFlight(double airDensity) {
        double avgVelocity = INITIAL_VELOCITY * 0.75;
        return RANGE / avgVelocity;
    }
    
    private double calculateBulletDrop(double airDensity, double timeOfFlight) {
        double g = 9.81;
        double densityFactor = airDensity / STANDARD_AIR_DENSITY;
        double baseDrop = 0.5 * g * Math.pow(timeOfFlight, 2);
        return baseDrop * (1 + (densityFactor - 1) * 0.3);
    }
    
    private double calculateRemainingVelocity(double airDensity) {
        double densityRatio = airDensity / STANDARD_AIR_DENSITY;
        double velocityDecayFactor = 0.15 * densityRatio;
        return INITIAL_VELOCITY * Math.exp(-velocityDecayFactor);
    }
    
    private String determineClimateType(WeatherData weatherData) {
        double temp = weatherData.getTemperature();
        double humidity = weatherData.getHumidity();
        
        if (temp >= 35 && humidity < 40) {
            return "高温干燥";
        } else if (temp >= 30 && humidity >= 70) {
            return "高温潮湿";
        } else if (temp <= -10) {
            return "严寒";
        } else if (temp <= 0 && humidity >= 60) {
            return "严寒潮湿";
        } else if (temp >= 20 && temp < 30 && humidity >= 60) {
            return "温暖潮湿";
        } else if (temp >= 10 && temp < 25 && humidity < 50) {
            return "温和干燥";
        } else {
            return "标准气候";
        }
    }
    
    public BallisticsResult calculateStandardConditionBallistics() {
        WeatherData standardWeather = new WeatherData();
        standardWeather.setTemperature(15.0);
        standardWeather.setHumidity(50.0);
        standardWeather.setPressure(1013.25);
        standardWeather.setAltitude(0.0);
        standardWeather.setDescription("标准气象条件");
        
        BallisticsResult result = calculateBallistics(standardWeather);
        result.setClimateType("标准气候");
        return result;
    }
}
