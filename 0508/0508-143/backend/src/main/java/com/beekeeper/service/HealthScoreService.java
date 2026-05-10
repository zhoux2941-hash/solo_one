package com.beekeeper.service;

import com.beekeeper.dto.HealthScoreDTO;
import com.beekeeper.entity.Beehive;
import com.beekeeper.entity.HiveRecord;
import com.beekeeper.repository.BeehiveRepository;
import com.beekeeper.repository.HiveRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.DoubleSummaryStatistics;
import java.util.IntSummaryStatistics;
import java.util.List;

@Service
@RequiredArgsConstructor
public class HealthScoreService {
    
    private final BeehiveRepository beehiveRepository;
    private final HiveRecordRepository hiveRecordRepository;
    
    private static final double OPTIMAL_MORNING_TEMP_MIN = 30.0;
    private static final double OPTIMAL_MORNING_TEMP_MAX = 38.0;
    private static final double OPTIMAL_EVENING_TEMP_MIN = 25.0;
    private static final double OPTIMAL_EVENING_TEMP_MAX = 35.0;
    private static final double MAX_DAILY_TEMP_DIFF = 8.0;
    
    private static final double OPTIMAL_HUMIDITY_MIN = 50.0;
    private static final double OPTIMAL_HUMIDITY_MAX = 80.0;
    private static final double CRITICAL_HUMIDITY_LOW = 30.0;
    private static final double CRITICAL_HUMIDITY_HIGH = 90.0;
    private static final double MAX_HUMIDITY_VARIANCE = 15.0;
    
    @Cacheable(value = "healthScores", key = "#beehiveId")
    public HealthScoreDTO calculateHealthScore(Long beehiveId) {
        Beehive beehive = beehiveRepository.findById(beehiveId)
                .orElseThrow(() -> new RuntimeException("蜂箱不存在"));
        
        LocalDate today = LocalDate.now();
        LocalDate startDate = today.minusDays(14);
        
        List<HiveRecord> records = hiveRecordRepository
                .findByBeehiveIdAndRecordDateBetween(beehiveId, startDate, today);
        
        HealthScoreDTO dto = new HealthScoreDTO();
        dto.setBeehiveId(beehiveId);
        dto.setHiveNumber(beehive.getHiveNumber());
        dto.setCalculationDate(today);
        dto.setIssues(new ArrayList<>());
        
        if (records.size() < 3) {
            dto.setOverallScore(50);
            dto.setLevel("数据不足");
            dto.setTemperatureStabilityScore(50.0);
            dto.setHumidityAppropriatenessScore(50.0);
            dto.setActivityTrendScore(50.0);
            dto.setRecommendation("建议增加记录频率，至少连续记录3天以上才能进行健康评估");
            dto.getIssues().add("历史数据不足，无法进行准确评估");
            return dto;
        }
        
        double tempStabilityScore = calculateTemperatureStability(records, dto);
        double humidityScore = calculateHumidityAppropriateness(records, dto);
        double activityTrendScore = calculateActivityTrend(records, dto);
        
        double overallScore = (tempStabilityScore * 0.4) 
                            + (humidityScore * 0.3) 
                            + (activityTrendScore * 0.3);
        
        dto.setTemperatureStabilityScore(tempStabilityScore);
        dto.setHumidityAppropriatenessScore(humidityScore);
        dto.setActivityTrendScore(activityTrendScore);
        dto.setOverallScore((int) Math.round(overallScore));
        
        if (overallScore >= 80) {
            dto.setLevel("优秀");
            dto.setRecommendation("蜂群状态良好，温湿度适宜，继续保持日常监测");
        } else if (overallScore >= 60) {
            dto.setLevel("良好");
            dto.setRecommendation("蜂群状态正常，关注可能的问题指标");
        } else if (overallScore >= 40) {
            dto.setLevel("一般");
            dto.setRecommendation("需要关注蜂群状态，建议检查温湿度和蜂群活动");
        } else {
            dto.setLevel("需要关注");
            dto.setRecommendation("蜂群可能存在问题，建议立即检查温湿度和蜂群情况");
        }
        
        return dto;
    }
    
    @Cacheable(value = "healthScores", key = "'all'")
    public List<HealthScoreDTO> calculateAllHealthScores() {
        List<Beehive> beehives = beehiveRepository.findAll();
        List<HealthScoreDTO> scores = new ArrayList<>();
        
        for (Beehive beehive : beehives) {
            scores.add(calculateHealthScore(beehive.getId()));
        }
        
        return scores;
    }
    
    private double calculateTemperatureStability(List<HiveRecord> records, HealthScoreDTO dto) {
        List<Double> morningTemps = new ArrayList<>();
        List<Double> eveningTemps = new ArrayList<>();
        List<Double> tempDifferences = new ArrayList<>();
        
        for (HiveRecord record : records) {
            if (record.getMorningTemperature() != null) {
                morningTemps.add(record.getMorningTemperature());
            }
            if (record.getEveningTemperature() != null) {
                eveningTemps.add(record.getEveningTemperature());
            }
            if (record.getMorningTemperature() != null && record.getEveningTemperature() != null) {
                tempDifferences.add(Math.abs(record.getEveningTemperature() - record.getMorningTemperature()));
            }
        }
        
        if (morningTemps.isEmpty() && eveningTemps.isEmpty()) {
            return 50.0;
        }
        
        double score = 100.0;
        
        if (!morningTemps.isEmpty()) {
            DoubleSummaryStatistics stats = morningTemps.stream()
                    .mapToDouble(Double::doubleValue)
                    .summaryStatistics();
            
            double avgMorning = stats.getAverage();
            if (avgMorning < OPTIMAL_MORNING_TEMP_MIN || avgMorning > OPTIMAL_MORNING_TEMP_MAX) {
                double deviation = Math.min(
                    Math.abs(avgMorning - OPTIMAL_MORNING_TEMP_MIN),
                    Math.abs(avgMorning - OPTIMAL_MORNING_TEMP_MAX)
                );
                score -= Math.min(25, deviation * 3);
                dto.getIssues().add("箱内早晨温度偏离正常范围（30-38°C），当前平均：" + String.format("%.1f°C", avgMorning));
            }
            
            double variance = calculateVariance(morningTemps, avgMorning);
            double stdDev = Math.sqrt(variance);
            if (stdDev > 3) {
                score -= Math.min(20, (stdDev - 3) * 5);
                dto.getIssues().add("早晨温度波动较大，标准差：" + String.format("%.1f°C", stdDev));
            }
        }
        
        if (!eveningTemps.isEmpty()) {
            DoubleSummaryStatistics stats = eveningTemps.stream()
                    .mapToDouble(Double::doubleValue)
                    .summaryStatistics();
            
            double avgEvening = stats.getAverage();
            if (avgEvening < OPTIMAL_EVENING_TEMP_MIN || avgEvening > OPTIMAL_EVENING_TEMP_MAX) {
                double deviation = Math.min(
                    Math.abs(avgEvening - OPTIMAL_EVENING_TEMP_MIN),
                    Math.abs(avgEvening - OPTIMAL_EVENING_TEMP_MAX)
                );
                score -= Math.min(25, deviation * 3);
                dto.getIssues().add("箱内晚间温度偏离正常范围（25-35°C），当前平均：" + String.format("%.1f°C", avgEvening));
            }
        }
        
        if (!tempDifferences.isEmpty()) {
            double avgDiff = tempDifferences.stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0);
            
            if (avgDiff > MAX_DAILY_TEMP_DIFF) {
                score -= Math.min(15, (avgDiff - MAX_DAILY_TEMP_DIFF) * 2);
                dto.getIssues().add("昼夜温差过大（>8°C），平均温差：" + String.format("%.1f°C", avgDiff));
            }
        }
        
        return Math.max(0, score);
    }
    
    private double calculateHumidityAppropriateness(List<HiveRecord> records, HealthScoreDTO dto) {
        List<Double> morningHumidities = new ArrayList<>();
        List<Double> eveningHumidities = new ArrayList<>();
        
        for (HiveRecord record : records) {
            if (record.getMorningHumidity() != null) {
                morningHumidities.add(record.getMorningHumidity());
            }
            if (record.getEveningHumidity() != null) {
                eveningHumidities.add(record.getEveningHumidity());
            }
        }
        
        if (morningHumidities.isEmpty() && eveningHumidities.isEmpty()) {
            dto.getIssues().add("未记录湿度数据，无法评估湿度适宜性");
            return 50.0;
        }
        
        double score = 100.0;
        
        int lowHumidityCount = 0;
        int highHumidityCount = 0;
        List<Double> allHumidities = new ArrayList<>();
        allHumidities.addAll(morningHumidities);
        allHumidities.addAll(eveningHumidities);
        
        for (Double humidity : allHumidities) {
            if (humidity < CRITICAL_HUMIDITY_LOW) {
                lowHumidityCount++;
            } else if (humidity > CRITICAL_HUMIDITY_HIGH) {
                highHumidityCount++;
            }
        }
        
        if (!morningHumidities.isEmpty()) {
            DoubleSummaryStatistics stats = morningHumidities.stream()
                    .mapToDouble(Double::doubleValue)
                    .summaryStatistics();
            
            double avgMorning = stats.getAverage();
            
            if (avgMorning < OPTIMAL_HUMIDITY_MIN) {
                double deviation = OPTIMAL_HUMIDITY_MIN - avgMorning;
                score -= Math.min(20, deviation * 1.5);
                if (avgMorning < CRITICAL_HUMIDITY_LOW) {
                    dto.getIssues().add("早晨湿度过低（<30%），平均：" + String.format("%.1f%%", avgMorning));
                } else {
                    dto.getIssues().add("早晨湿度偏低，平均：" + String.format("%.1f%%", avgMorning));
                }
            } else if (avgMorning > OPTIMAL_HUMIDITY_MAX) {
                double deviation = avgMorning - OPTIMAL_HUMIDITY_MAX;
                score -= Math.min(20, deviation * 1.5);
                if (avgMorning > CRITICAL_HUMIDITY_HIGH) {
                    dto.getIssues().add("早晨湿度过高（>90%），平均：" + String.format("%.1f%%", avgMorning));
                } else {
                    dto.getIssues().add("早晨湿度偏高，平均：" + String.format("%.1f%%", avgMorning));
                }
            }
            
            double variance = calculateVariance(morningHumidities, avgMorning);
            double stdDev = Math.sqrt(variance);
            if (stdDev > MAX_HUMIDITY_VARIANCE) {
                score -= Math.min(15, (stdDev - MAX_HUMIDITY_VARIANCE) * 1.5);
                dto.getIssues().add("早晨湿度波动较大，标准差：" + String.format("%.1f%%", stdDev));
            }
        }
        
        if (!eveningHumidities.isEmpty()) {
            DoubleSummaryStatistics stats = eveningHumidities.stream()
                    .mapToDouble(Double::doubleValue)
                    .summaryStatistics();
            
            double avgEvening = stats.getAverage();
            
            if (avgEvening < OPTIMAL_HUMIDITY_MIN) {
                double deviation = OPTIMAL_HUMIDITY_MIN - avgEvening;
                score -= Math.min(20, deviation * 1.5);
                if (avgEvening < CRITICAL_HUMIDITY_LOW) {
                    dto.getIssues().add("晚间湿度过低（<30%），平均：" + String.format("%.1f%%", avgEvening));
                } else {
                    dto.getIssues().add("晚间湿度偏低，平均：" + String.format("%.1f%%", avgEvening));
                }
            } else if (avgEvening > OPTIMAL_HUMIDITY_MAX) {
                double deviation = avgEvening - OPTIMAL_HUMIDITY_MAX;
                score -= Math.min(20, deviation * 1.5);
                if (avgEvening > CRITICAL_HUMIDITY_HIGH) {
                    dto.getIssues().add("晚间湿度过高（>90%），平均：" + String.format("%.1f%%", avgEvening));
                } else {
                    dto.getIssues().add("晚间湿度偏高，平均：" + String.format("%.1f%%", avgEvening));
                }
            }
        }
        
        if (lowHumidityCount > 0) {
            dto.getIssues().add("共检测到 " + lowHumidityCount + " 次严重低湿情况（<30%）");
        }
        if (highHumidityCount > 0) {
            dto.getIssues().add("共检测到 " + highHumidityCount + " 次严重高湿情况（>90%）");
        }
        
        if (score >= 80) {
        } else if (score >= 60) {
            if (dto.getIssues().stream().noneMatch(i -> i.contains("湿度"))) {
                dto.getIssues().add("湿度基本适宜，建议继续监测");
            }
        } else {
            if (lowHumidityCount > 0) {
                dto.getIssues().add("建议：增加喂水、使用保湿材料");
            }
            if (highHumidityCount > 0) {
                dto.getIssues().add("建议：加强通风、降低箱内湿度");
            }
        }
        
        return Math.max(0, score);
    }
    
    private double calculateActivityTrend(List<HiveRecord> records, HealthScoreDTO dto) {
        List<Integer> activities = records.stream()
                .map(HiveRecord::getActivityLevel)
                .toList();
        
        IntSummaryStatistics stats = activities.stream()
                .mapToInt(Integer::intValue)
                .summaryStatistics();
        
        double avgActivity = stats.getAverage();
        double score = 100.0;
        
        if (avgActivity < 4) {
            double deviation = 4 - avgActivity;
            score -= Math.min(35, deviation * 10);
            dto.getIssues().add("蜜蜂活动强度偏低，平均：" + String.format("%.1f", avgActivity));
        } else if (avgActivity < 6) {
            double deviation = 6 - avgActivity;
            score -= Math.min(15, deviation * 5);
        }
        
        if (records.size() >= 5) {
            List<Integer> recent = activities.subList(0, Math.min(5, activities.size()));
            List<Integer> older = activities.subList(Math.min(5, activities.size()), activities.size());
            
            double recentAvg = recent.stream().mapToInt(Integer::intValue).average().orElse(0);
            double olderAvg = older.stream().mapToInt(Integer::intValue).average().orElse(0);
            
            double trend = recentAvg - olderAvg;
            if (trend < -2) {
                score -= Math.min(25, Math.abs(trend) * 5);
                dto.getIssues().add("蜜蜂活动呈下降趋势，近期比前期下降：" + String.format("%.1f", Math.abs(trend)));
            } else if (trend > 0) {
                score += Math.min(10, trend * 3);
            }
        }
        
        if (stats.getMax() <= 3) {
            score -= 15;
            dto.getIssues().add("近期活动强度持续偏低，最高值：" + stats.getMax());
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    private double calculateVariance(List<Double> values, double mean) {
        return values.stream()
                .mapToDouble(v -> Math.pow(v - mean, 2))
                .average()
                .orElse(0);
    }
}
