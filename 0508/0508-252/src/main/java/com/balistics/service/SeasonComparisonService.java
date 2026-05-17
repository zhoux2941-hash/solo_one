package com.balistics.service;

import com.balistics.entity.BallisticsResult;
import com.balistics.entity.WeatherData;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
public class SeasonComparisonService {
    
    @Autowired
    private BallisticsDragService ballisticsDragService;
    
    public Map<String, BallisticsResult> compareFourSeasons() {
        Map<String, BallisticsResult> results = new HashMap<>();
        
        results.put("春季", calculateSpring());
        results.put("夏季", calculateSummer());
        results.put("秋季", calculateAutumn());
        results.put("冬季", calculateWinter());
        
        return results;
    }
    
    public Map<String, BallisticsResult> compareExtremeConditions() {
        Map<String, BallisticsResult> results = new HashMap<>();
        
        results.put("高温干燥", calculateHotDry());
        results.put("高温潮湿", calculateHotHumid());
        results.put("严寒", calculateSevereCold());
        results.put("严寒潮湿", calculateColdHumid());
        results.put("标准气候", ballisticsDragService.calculateStandardConditionBallistics());
        
        return results;
    }
    
    private BallisticsResult calculateSpring() {
        WeatherData springWeather = new WeatherData();
        springWeather.setTemperature(15.0);
        springWeather.setHumidity(55.0);
        springWeather.setPressure(1010.0);
        springWeather.setAltitude(0.0);
        springWeather.setSeason("春季");
        springWeather.setDescription("春季典型气候");
        return ballisticsDragService.calculateBallistics(springWeather);
    }
    
    private BallisticsResult calculateSummer() {
        WeatherData summerWeather = new WeatherData();
        summerWeather.setTemperature(32.0);
        summerWeather.setHumidity(75.0);
        summerWeather.setPressure(1005.0);
        summerWeather.setAltitude(0.0);
        summerWeather.setSeason("夏季");
        summerWeather.setDescription("夏季典型气候");
        return ballisticsDragService.calculateBallistics(summerWeather);
    }
    
    private BallisticsResult calculateAutumn() {
        WeatherData autumnWeather = new WeatherData();
        autumnWeather.setTemperature(18.0);
        autumnWeather.setHumidity(60.0);
        autumnWeather.setPressure(1015.0);
        autumnWeather.setAltitude(0.0);
        autumnWeather.setSeason("秋季");
        autumnWeather.setDescription("秋季典型气候");
        return ballisticsDragService.calculateBallistics(autumnWeather);
    }
    
    private BallisticsResult calculateWinter() {
        WeatherData winterWeather = new WeatherData();
        winterWeather.setTemperature(-5.0);
        winterWeather.setHumidity(40.0);
        winterWeather.setPressure(1020.0);
        winterWeather.setAltitude(0.0);
        winterWeather.setSeason("冬季");
        winterWeather.setDescription("冬季典型气候");
        return ballisticsDragService.calculateBallistics(winterWeather);
    }
    
    private BallisticsResult calculateHotDry() {
        WeatherData weather = new WeatherData();
        weather.setTemperature(38.0);
        weather.setHumidity(20.0);
        weather.setPressure(1000.0);
        weather.setAltitude(0.0);
        weather.setDescription("高温干燥极端气候");
        return ballisticsDragService.calculateBallistics(weather);
    }
    
    private BallisticsResult calculateHotHumid() {
        WeatherData weather = new WeatherData();
        weather.setTemperature(35.0);
        weather.setHumidity(85.0);
        weather.setPressure(1002.0);
        weather.setAltitude(0.0);
        weather.setDescription("高温潮湿极端气候");
        return ballisticsDragService.calculateBallistics(weather);
    }
    
    private BallisticsResult calculateSevereCold() {
        WeatherData weather = new WeatherData();
        weather.setTemperature(-25.0);
        weather.setHumidity(30.0);
        weather.setPressure(1025.0);
        weather.setAltitude(0.0);
        weather.setDescription("严寒极端气候");
        return ballisticsDragService.calculateBallistics(weather);
    }
    
    private BallisticsResult calculateColdHumid() {
        WeatherData weather = new WeatherData();
        weather.setTemperature(-15.0);
        weather.setHumidity(70.0);
        weather.setPressure(1022.0);
        weather.setAltitude(0.0);
        weather.setDescription("严寒潮湿极端气候");
        return ballisticsDragService.calculateBallistics(weather);
    }
    
    public String generateComparisonReport(Map<String, BallisticsResult> results) {
        BallisticsResult standard = results.get("标准气候");
        if (standard == null) {
            standard = ballisticsDragService.calculateStandardConditionBallistics();
        }
        
        StringBuilder report = new StringBuilder();
        report.append("===== 气象弹道差异对比分析报告 =====\n\n");
        
        for (Map.Entry<String, BallisticsResult> entry : results.entrySet()) {
            String condition = entry.getKey();
            BallisticsResult result = entry.getValue();
            
            if (condition.equals("标准气候")) continue;
            
            double dropDiff = result.getBulletDrop() - standard.getBulletDrop();
            double velocityDiff = result.getRemainingVelocity() - standard.getRemainingVelocity();
            double densityDiff = result.getAirDensity() - standard.getAirDensity();
            
            report.append("【").append(condition).append("】\n");
            report.append(String.format("  空气密度: %.4f kg/m³ (差异: %+.4f)\n", 
                result.getAirDensity(), densityDiff));
            report.append(String.format("  弹道下坠: %.2f m (差异: %+.2f)\n", 
                result.getBulletDrop(), dropDiff));
            report.append(String.format("  剩余速度: %.2f m/s (差异: %+.2f)\n", 
                result.getRemainingVelocity(), velocityDiff));
            report.append(String.format("  阻力修正系数: %.4f\n\n", result.getDragCorrectionFactor()));
        }
        
        return report.toString();
    }
}
