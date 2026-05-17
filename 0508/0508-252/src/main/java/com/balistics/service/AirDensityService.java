package com.balistics.service;

import com.balistics.entity.WeatherData;
import org.springframework.stereotype.Service;

@Service
public class AirDensityService {
    
    private static final double R_DRY = 287.058;
    private static final double R_VAPOR = 461.495;
    private static final double MOLAR_MASS_DRY_AIR = 0.0289644;
    private static final double MOLAR_MASS_WATER = 0.018016;
    private static final double GAS_CONSTANT = 8.31432;
    
    public double calculateAirDensity(WeatherData weatherData) {
        double T = weatherData.getTemperature() + 273.15;
        double P = weatherData.getPressure() * 100;
        double RH = weatherData.getHumidity() / 100.0;
        double h = weatherData.getAltitude();
        
        double saturationVaporPressure = calculateSaturationVaporPressure(weatherData.getTemperature());
        double vaporPressure = RH * saturationVaporPressure;
        double dryAirPressure = P - vaporPressure;
        
        double densityDry = (dryAirPressure * MOLAR_MASS_DRY_AIR) / (GAS_CONSTANT * T);
        double densityVapor = (vaporPressure * MOLAR_MASS_WATER) / (GAS_CONSTANT * T);
        
        double altitudeCorrection = calculateAltitudeCorrection(h, T);
        double airDensity = (densityDry + densityVapor) * altitudeCorrection;
        
        return Math.round(airDensity * 10000.0) / 10000.0;
    }
    
    private double calculateSaturationVaporPressure(double temperature) {
        double T = temperature;
        double a = 6.1121;
        double b = 17.502;
        double c = 240.97;
        
        double es = a * Math.exp((b * T) / (c + T));
        return es * 100;
    }
    
    private double calculateAltitudeCorrection(double altitude, double temperature) {
        double lapseRate = 0.0065;
        double seaLevelTemp = 288.15;
        double exponent = (-9.80665 * 0.0289644) / (8.31432 * (-lapseRate));
        
        double ratio = 1 - (lapseRate * altitude) / seaLevelTemp;
        return Math.pow(ratio, exponent);
    }
    
    public double getStandardAirDensity() {
        return 1.225;
    }
    
    public double calculateDensityRatio(double actualDensity) {
        return actualDensity / getStandardAirDensity();
    }
}
