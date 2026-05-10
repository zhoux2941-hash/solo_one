package com.beekeeper.service;

import com.beekeeper.dto.BloomingPredictionDTO;
import com.beekeeper.entity.NectarSource;
import com.beekeeper.entity.TemperatureRecord;
import com.beekeeper.repository.NectarSourceRepository;
import com.beekeeper.repository.TemperatureRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BloomingPredictionService {
    
    private final NectarSourceRepository nectarSourceRepository;
    private final TemperatureRecordRepository temperatureRecordRepository;
    
    private static final int RECENT_DAYS_WEIGHTED = 7;
    private static final int COLD_SNAP_THRESHOLD_DAYS = 3;
    private static final double COLD_SNAP_TEMP_DROP = 5.0;
    
    public List<BloomingPredictionDTO> predictAllBlooming() {
        List<NectarSource> sources = nectarSourceRepository.findByActiveTrue();
        List<BloomingPredictionDTO> predictions = new ArrayList<>();
        
        for (NectarSource source : sources) {
            predictions.add(predictBlooming(source));
        }
        
        return predictions;
    }
    
    public BloomingPredictionDTO predictBloomingById(Long sourceId) {
        NectarSource source = nectarSourceRepository.findById(sourceId)
                .orElseThrow(() -> new RuntimeException("蜜源植物不存在"));
        return predictBlooming(source);
    }
    
    private BloomingPredictionDTO predictBlooming(NectarSource source) {
        LocalDate today = LocalDate.now();
        int year = today.getYear();
        
        LocalDate startDate = calculateAccumulationStartDate(source, today);
        
        List<TemperatureRecord> tempRecords = temperatureRecordRepository
                .findByRecordDateBetween(startDate, today);
        
        if (tempRecords.isEmpty()) {
            return createPredictionWithNoData(source, today);
        }
        
        double accumulatedDD = calculateDegreeDays(tempRecords, source.getBaseTemperature());
        double remainingDD = Math.max(0, source.getRequiredDegreeDays() - accumulatedDD);
        double progress = Math.min(100.0, (accumulatedDD / source.getRequiredDegreeDays()) * 100);
        
        LocalDate predictedStartDate;
        String status;
        String predictionNote = "";
        
        ColdSnapInfo coldSnapInfo = detectColdSnap(tempRecords, source.getBaseTemperature());
        if (coldSnapInfo.isColdSnap) {
            predictionNote = "检测到倒春寒，预测已动态调整";
        }
        
        if (accumulatedDD >= source.getRequiredDegreeDays()) {
            predictedStartDate = estimateStartDate(tempRecords, source);
            status = "已开花";
        } else {
            double weightedAvgDD = calculateWeightedAverageDailyDD(tempRecords, source.getBaseTemperature(), coldSnapInfo);
            double trendFactor = calculateTemperatureTrendFactor(tempRecords, source.getBaseTemperature());
            
            if (weightedAvgDD <= 0) {
                weightedAvgDD = estimateExpectedDailyDD(source, today);
            }
            
            double adjustedDailyDD = weightedAvgDD * trendFactor;
            if (adjustedDailyDD <= 0.5) {
                adjustedDailyDD = 0.5;
            }
            
            long daysNeeded = (long) Math.ceil(remainingDD / adjustedDailyDD);
            
            predictedStartDate = today.plusDays(daysNeeded);
            
            predictedStartDate = adjustForSeasonalPattern(predictedStartDate, source);
            
            status = "预测中";
        }
        
        LocalDate predictedEndDate = predictedStartDate.plusDays(20);
        
        BloomingPredictionDTO dto = new BloomingPredictionDTO();
        dto.setNectarSourceId(source.getId());
        dto.setNectarSourceName(source.getName());
        dto.setSeason(source.getSeason());
        dto.setRequiredDegreeDays(source.getRequiredDegreeDays());
        dto.setAccumulatedDegreeDays(accumulatedDD);
        dto.setRemainingDegreeDays(remainingDD);
        dto.setPredictedStartDate(predictedStartDate);
        dto.setPredictedEndDate(predictedEndDate);
        dto.setProgress(progress);
        dto.setStatus(status);
        
        return dto;
    }
    
    private LocalDate calculateAccumulationStartDate(NectarSource source, LocalDate today) {
        int year = today.getYear();
        
        if (source.getTypicalStartMonth() != null) {
            int startMonth = source.getTypicalStartMonth();
            
            int startYear = year;
            if (today.getMonthValue() < startMonth - 3) {
                startYear--;
            }
            
            return LocalDate.of(startYear, Math.max(1, startMonth - 3), 1);
        }
        
        return LocalDate.of(year, 1, 1);
    }
    
    private double calculateDegreeDays(List<TemperatureRecord> records, double baseTemp) {
        return records.stream()
                .mapToDouble(r -> {
                    double avgTemp = (r.getMaxTemperature() + r.getMinTemperature()) / 2.0;
                    return Math.max(0, avgTemp - baseTemp);
                })
                .sum();
    }
    
    private double calculateWeightedAverageDailyDD(List<TemperatureRecord> records, double baseTemp, ColdSnapInfo coldSnapInfo) {
        if (records.isEmpty()) return 0;
        
        int recentDays = Math.min(RECENT_DAYS_WEIGHTED, records.size());
        List<TemperatureRecord> recentRecords = records.subList(records.size() - recentDays, records.size());
        
        double weightedSum = 0;
        double totalWeight = 0;
        
        for (int i = 0; i < recentRecords.size(); i++) {
            TemperatureRecord r = recentRecords.get(i);
            double avgTemp = (r.getMaxTemperature() + r.getMinTemperature()) / 2.0;
            double dd = Math.max(0, avgTemp - baseTemp);
            
            double weight = 1.0 + (i * 0.15);
            
            boolean isColdDay = coldSnapInfo.coldDays.contains(r.getRecordDate());
            if (isColdDay) {
                weight *= 1.2;
            }
            
            weightedSum += dd * weight;
            totalWeight += weight;
        }
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    private double calculateTemperatureTrendFactor(List<TemperatureRecord> records, double baseTemp) {
        if (records.size() < 7) return 1.0;
        
        int daysForTrend = Math.min(14, records.size());
        List<TemperatureRecord> trendRecords = records.subList(records.size() - daysForTrend, records.size());
        
        int firstHalf = daysForTrend / 2;
        List<TemperatureRecord> earlier = trendRecords.subList(0, firstHalf);
        List<TemperatureRecord> later = trendRecords.subList(firstHalf, daysForTrend);
        
        double earlierAvgDD = calculateAverageDailyDegreeDays(earlier, baseTemp);
        double laterAvgDD = calculateAverageDailyDegreeDays(later, baseTemp);
        
        if (earlierAvgDD <= 0) return 1.0;
        
        double trendRatio = laterAvgDD / earlierAvgDD;
        
        if (trendRatio < 0.5) {
            return 0.6;
        } else if (trendRatio < 0.8) {
            return 0.8;
        } else if (trendRatio > 1.5) {
            return 1.3;
        } else if (trendRatio > 1.2) {
            return 1.15;
        }
        
        return 1.0;
    }
    
    private double calculateAverageDailyDegreeDays(List<TemperatureRecord> records, double baseTemp) {
        if (records.isEmpty()) return 0;
        return calculateDegreeDays(records, baseTemp) / records.size();
    }
    
    private ColdSnapInfo detectColdSnap(List<TemperatureRecord> records, double baseTemp) {
        ColdSnapInfo info = new ColdSnapInfo();
        
        if (records.size() < COLD_SNAP_THRESHOLD_DAYS + 3) {
            return info;
        }
        
        int checkDays = Math.min(14, records.size());
        List<TemperatureRecord> recentRecords = records.subList(records.size() - checkDays, records.size());
        
        for (int i = 3; i < recentRecords.size(); i++) {
            boolean consecutiveCold = true;
            List<LocalDate> coldDays = new ArrayList<>();
            
            for (int j = 0; j < COLD_SNAP_THRESHOLD_DAYS; j++) {
                TemperatureRecord current = recentRecords.get(i - j);
                TemperatureReference ref = getTemperatureReference(recentRecords, i - j);
                
                double avgTemp = (current.getMaxTemperature() + current.getMinTemperature()) / 2.0;
                
                if (avgTemp >= baseTemp || (ref.avgTemp - avgTemp < COLD_SNAP_TEMP_DROP)) {
                    consecutiveCold = false;
                    break;
                }
                coldDays.add(current.getRecordDate());
            }
            
            if (consecutiveCold) {
                info.isColdSnap = true;
                info.coldDays.addAll(coldDays);
                info.coldSnapStartDate = coldDays.get(coldDays.size() - 1);
            }
        }
        
        return info;
    }
    
    private TemperatureReference getTemperatureReference(List<TemperatureRecord> records, int currentIndex) {
        int startIndex = Math.max(0, currentIndex - 7);
        int endIndex = Math.min(currentIndex, records.size());
        
        if (startIndex >= endIndex) {
            TemperatureRecord r = records.get(currentIndex);
            return new TemperatureReference((r.getMaxTemperature() + r.getMinTemperature()) / 2.0);
        }
        
        double sum = 0;
        int count = 0;
        
        for (int i = startIndex; i < endIndex; i++) {
            TemperatureRecord r = records.get(i);
            sum += (r.getMaxTemperature() + r.getMinTemperature()) / 2.0;
            count++;
        }
        
        return new TemperatureReference(sum / count);
    }
    
    private double estimateExpectedDailyDD(NectarSource source, LocalDate today) {
        int month = today.getMonthValue();
        
        double baseDD = switch (source.getSeason()) {
            case "春季" -> switch (month) {
                case 1, 2 -> 1.0;
                case 3 -> 3.0;
                case 4 -> 6.0;
                default -> 8.0;
            };
            case "春末夏初" -> switch (month) {
                case 1, 2 -> 1.0;
                case 3, 4 -> 4.0;
                case 5 -> 7.0;
                default -> 9.0;
            };
            case "夏季" -> switch (month) {
                case 1, 2, 3 -> 1.0;
                case 4, 5 -> 5.0;
                case 6 -> 8.0;
                default -> 10.0;
            };
            case "秋季" -> switch (month) {
                case 1, 2 -> 0.5;
                case 3, 4, 5 -> 2.0;
                case 6, 7, 8 -> 6.0;
                case 9 -> 4.0;
                default -> 2.0;
            };
            default -> 5.0;
        };
        
        return Math.max(0.5, baseDD - source.getBaseTemperature() + 5);
    }
    
    private LocalDate adjustForSeasonalPattern(LocalDate predictedDate, NectarSource source) {
        if (source.getTypicalStartMonth() == null) {
            return predictedDate;
        }
        
        int typicalMonth = source.getTypicalStartMonth();
        int predictedMonth = predictedDate.getMonthValue();
        
        LocalDate earliestDate = LocalDate.of(predictedDate.getYear(), Math.max(1, typicalMonth - 2), 1);
        LocalDate latestDate = LocalDate.of(predictedDate.getYear(), Math.min(12, typicalMonth + 2), 28);
        
        if (predictedDate.isBefore(earliestDate)) {
            return earliestDate;
        }
        if (predictedDate.isAfter(latestDate)) {
            return latestDate;
        }
        
        return predictedDate;
    }
    
    private LocalDate estimateStartDate(List<TemperatureRecord> records, NectarSource source) {
        double accumulated = 0;
        double baseTemp = source.getBaseTemperature();
        double required = source.getRequiredDegreeDays();
        
        for (int i = records.size() - 1; i >= 0; i--) {
            TemperatureRecord r = records.get(i);
            double avgTemp = (r.getMaxTemperature() + r.getMinTemperature()) / 2.0;
            accumulated += Math.max(0, avgTemp - baseTemp);
            
            if (accumulated >= required) {
                return r.getRecordDate();
            }
        }
        
        return LocalDate.now();
    }
    
    private BloomingPredictionDTO createPredictionWithNoData(NectarSource source, LocalDate today) {
        BloomingPredictionDTO dto = new BloomingPredictionDTO();
        dto.setNectarSourceId(source.getId());
        dto.setNectarSourceName(source.getName());
        dto.setSeason(source.getSeason());
        dto.setRequiredDegreeDays(source.getRequiredDegreeDays());
        dto.setAccumulatedDegreeDays(0.0);
        dto.setRemainingDegreeDays(source.getRequiredDegreeDays());
        dto.setProgress(0.0);
        dto.setStatus("数据不足");
        
        if (source.getTypicalStartMonth() != null) {
            int year = today.getYear();
            if (today.getMonthValue() > source.getTypicalEndMonth()) {
                year++;
            }
            LocalDate typicalStart = LocalDate.of(year, source.getTypicalStartMonth(), 15);
            dto.setPredictedStartDate(typicalStart);
            dto.setPredictedEndDate(typicalStart.plusDays(20));
        } else {
            dto.setPredictedStartDate(today.plusDays(30));
            dto.setPredictedEndDate(today.plusDays(50));
        }
        
        return dto;
    }
    
    public void initializeDefaultNectarSources() {
        if (nectarSourceRepository.count() == 0) {
            List<NectarSource> sources = new ArrayList<>();
            
            NectarSource rape = new NectarSource();
            rape.setName("油菜");
            rape.setSeason("春季");
            rape.setRequiredDegreeDays(800.0);
            rape.setBaseTemperature(5.0);
            rape.setTypicalStartMonth(3);
            rape.setTypicalEndMonth(4);
            rape.setDescription("春季主要蜜源，花期约20-30天");
            sources.add(rape);
            
            NectarSource acacia = new NectarSource();
            acacia.setName("洋槐");
            acacia.setSeason("春末夏初");
            acacia.setRequiredDegreeDays(1200.0);
            acacia.setBaseTemperature(10.0);
            acacia.setTypicalStartMonth(5);
            acacia.setTypicalEndMonth(6);
            acacia.setDescription("优质蜜源，花期约10-15天");
            sources.add(acacia);
            
            NectarSource linden = new NectarSource();
            linden.setName("椴树");
            linden.setSeason("夏季");
            linden.setRequiredDegreeDays(1800.0);
            linden.setBaseTemperature(10.0);
            linden.setTypicalStartMonth(7);
            linden.setTypicalEndMonth(8);
            linden.setDescription("夏季主要蜜源，花期约20天");
            sources.add(linden);
            
            NectarSource buckwheat = new NectarSource();
            buckwheat.setName("荞麦");
            buckwheat.setSeason("秋季");
            buckwheat.setRequiredDegreeDays(600.0);
            buckwheat.setBaseTemperature(10.0);
            buckwheat.setTypicalStartMonth(9);
            buckwheat.setTypicalEndMonth(10);
            buckwheat.setDescription("秋季辅助蜜源，花期约25天");
            sources.add(buckwheat);
            
            nectarSourceRepository.saveAll(sources);
        }
    }
    
    private static class ColdSnapInfo {
        boolean isColdSnap = false;
        LocalDate coldSnapStartDate = null;
        List<LocalDate> coldDays = new ArrayList<>();
    }
    
    private static class TemperatureReference {
        final double avgTemp;
        
        TemperatureReference(double avgTemp) {
            this.avgTemp = avgTemp;
        }
    }
}
