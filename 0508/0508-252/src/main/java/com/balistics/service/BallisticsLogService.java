package com.balistics.service;

import com.balistics.entity.BallisticsLog;
import com.balistics.entity.BallisticsResult;
import com.balistics.entity.WeatherData;
import com.balistics.repository.BallisticsLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BallisticsLogService {
    
    @Autowired
    private BallisticsLogRepository ballisticsLogRepository;
    
    public BallisticsLog createCalculationLog(BallisticsResult result) {
        BallisticsLog log = new BallisticsLog();
        log.setLogType("弹道计算");
        log.setClimateCondition(result.getClimateType());
        
        WeatherData weather = result.getWeatherData();
        log.setTemperature(weather.getTemperature());
        log.setHumidity(weather.getHumidity());
        log.setPressure(weather.getPressure());
        log.setAirDensity(result.getAirDensity());
        log.setBulletDrop(result.getBulletDrop());
        log.setVelocityDrop(result.getVelocityDrop());
        
        String logContent = generateLogContent(result);
        log.setLogContent(logContent);
        
        return ballisticsLogRepository.save(log);
    }
    
    public BallisticsLog createComparisonLog(String comparisonReport) {
        BallisticsLog log = new BallisticsLog();
        log.setLogType("对比分析");
        log.setLogContent(comparisonReport);
        
        return ballisticsLogRepository.save(log);
    }
    
    private String generateLogContent(BallisticsResult result) {
        WeatherData weather = result.getWeatherData();
        
        StringBuilder sb = new StringBuilder();
        sb.append("===== 气象弹道计算日志 =====\n\n");
        sb.append("【气象参数】\n");
        sb.append(String.format("  温度: %.1f °C\n", weather.getTemperature()));
        sb.append(String.format("  湿度: %.1f %%\n", weather.getHumidity()));
        sb.append(String.format("  气压: %.2f hPa\n", weather.getPressure()));
        sb.append(String.format("  海拔: %.1f m\n", weather.getAltitude()));
        if (weather.getSeason() != null) {
            sb.append(String.format("  季节: %s\n", weather.getSeason()));
        }
        if (weather.getDescription() != null) {
            sb.append(String.format("  描述: %s\n", weather.getDescription()));
        }
        
        sb.append("\n【空气密度计算结果】\n");
        sb.append(String.format("  实际空气密度: %.4f kg/m³\n", result.getAirDensity()));
        sb.append(String.format("  标准空气密度: %.4f kg/m³\n", 1.225));
        sb.append(String.format("  密度比(阻力修正系数): %.4f\n", result.getDragCorrectionFactor()));
        
        sb.append("\n【弹道阻力修正结果】\n");
        sb.append(String.format("  修正后阻力系数: %.4f\n", result.getDragCoefficient()));
        sb.append(String.format("  空气阻力: %.2f N\n", result.getDragForce()));
        
        sb.append("\n【弹道推算结果】\n");
        sb.append(String.format("  飞行时间: %.3f s\n", result.getTimeOfFlight()));
        sb.append(String.format("  弹道下坠: %.2f m\n", result.getBulletDrop()));
        sb.append(String.format("  初速度: 900.00 m/s\n"));
        sb.append(String.format("  剩余速度: %.2f m/s\n", result.getRemainingVelocity()));
        sb.append(String.format("  速度衰减: %.2f m/s\n", result.getVelocityDrop()));
        
        sb.append("\n【气候类型】\n");
        sb.append(String.format("  %s\n", result.getClimateType()));
        
        sb.append("\n【分析结论】\n");
        sb.append(generateAnalysisConclusion(result));
        
        return sb.toString();
    }
    
    private String generateAnalysisConclusion(BallisticsResult result) {
        double correctionFactor = result.getDragCorrectionFactor();
        StringBuilder sb = new StringBuilder();
        
        if (correctionFactor > 1.05) {
            sb.append("  空气密度高于标准值，子弹飞行阻力增大。\n");
            sb.append("  弹道下坠较标准条件增加，存速能力下降。\n");
            sb.append("  建议进行射程表修正，瞄准点需适当抬高。\n");
        } else if (correctionFactor < 0.95) {
            sb.append("  空气密度低于标准值，子弹飞行阻力减小。\n");
            sb.append("  弹道下坠较标准条件减少，存速能力提升。\n");
            sb.append("  实际射程可能比理论值更远，需注意过远弹着点。\n");
        } else {
            sb.append("  空气密度接近标准值，弹道特性与标准条件基本一致。\n");
            sb.append("  可直接使用标准射程表进行瞄准。\n");
        }
        
        double temp = result.getWeatherData().getTemperature();
        if (temp > 30) {
            sb.append("  高温环境下火药燃烧效率可能变化，建议进行实弹验证。\n");
        } else if (temp < -10) {
            sb.append("  严寒环境下枪械机件性能可能受影响，请注意设备维护。\n");
        }
        
        return sb.toString();
    }
    
    public List<BallisticsLog> getAllLogs() {
        return ballisticsLogRepository.findAllByOrderByCreateTimeDesc();
    }
    
    public List<BallisticsLog> getRecentLogs(int limit) {
        if (limit <= 10) {
            return ballisticsLogRepository.findTop10ByOrderByCreateTimeDesc();
        }
        return ballisticsLogRepository.findAllByOrderByCreateTimeDesc(org.springframework.data.domain.PageRequest.of(0, limit));
    }
    
    public List<BallisticsLog> getLogsByType(String logType) {
        return ballisticsLogRepository.findByLogTypeOrderByCreateTimeDesc(logType);
    }
    
    public BallisticsLog getLogById(Long id) {
        return ballisticsLogRepository.findById(id).orElse(null);
    }
    
    public void deleteLog(Long id) {
        ballisticsLogRepository.deleteById(id);
    }
}
