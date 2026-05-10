package com.fishing.service;

import com.fishing.dto.FishingRecordDTO;
import com.fishing.dto.HeatmapDataDTO;
import com.fishing.dto.LureRecommendationDTO;
import com.fishing.entity.FishSpecies;
import com.fishing.entity.FishingRecord;
import com.fishing.entity.Lure;
import com.fishing.repository.FishSpeciesRepository;
import com.fishing.repository.FishingRecordRepository;
import com.fishing.repository.LureRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FishingRecordService {

    private final FishingRecordRepository fishingRecordRepository;
    private final LureRepository lureRepository;
    private final FishSpeciesRepository fishSpeciesRepository;
    private final UserRepository userRepository;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final int ECO_POINTS_PER_RELEASE = 10;
    private static final double ECO_BONUS_BASE = 0.15;
    private static final double MAX_ECO_BONUS = 0.30;

    private static final String LURE_RECOMMENDATION_CACHE = "lure:recommendation:";
    private static final String HEATMAP_CACHE = "heatmap:data";

    @Transactional
    public FishingRecord createRecord(FishingRecordDTO dto) {
        FishingRecord record = new FishingRecord();
        record.setUserId(dto.getUserId());
        record.setSpotId(dto.getSpotId());
        record.setFishSpeciesId(dto.getFishSpeciesId());
        record.setLureId(dto.getLureId());
        record.setFishDate(dto.getFishDate());
        record.setAirTemp(dto.getAirTemp());
        record.setWaterTemp(dto.getWaterTemp());
        record.setAirPressure(dto.getAirPressure());
        record.setWeather(dto.getWeather());
        record.setWaterVisibility(dto.getWaterVisibility());
        record.setCatchCount(dto.getCatchCount() != null ? dto.getCatchCount() : 1);
        
        int releaseCount = dto.getReleaseCount() != null ? dto.getReleaseCount() : 0;
        int catchCount = record.getCatchCount();
        if (releaseCount > catchCount) {
            releaseCount = catchCount;
        }
        record.setReleaseCount(releaseCount);
        
        int ecoPointsEarned = releaseCount * ECO_POINTS_PER_RELEASE;
        record.setEcoPointsEarned(ecoPointsEarned);
        
        record.setNotes(dto.getNotes());
        
        FishingRecord saved = fishingRecordRepository.save(record);
        
        if (ecoPointsEarned > 0) {
            userRepository.findById(dto.getUserId()).ifPresent(user -> {
                user.setEcoPoints(user.getEcoPoints() + ecoPointsEarned);
                user.setTotalReleased(user.getTotalReleased() + releaseCount);
                userRepository.save(user);
            });
        }
        
        clearCache();
        return saved;
    }

    public List<FishingRecord> getRecordsByUser(Long userId) {
        return fishingRecordRepository.findByUserIdOrderByFishDateDesc(userId);
    }

    private static final int MIN_SAMPLE_THRESHOLD = 3;
    private static final double MIN_SUCCESS_RATE = 0.05;

    public List<LureRecommendationDTO> getLureRecommendations(
            BigDecimal waterTemp, 
            BigDecimal airTemp, 
            Long speciesId) {
        
        String cacheKey = LURE_RECOMMENDATION_CACHE + waterTemp + ":" + airTemp + ":" + (speciesId != null ? speciesId : "all");
        List<LureRecommendationDTO> cached = (List<LureRecommendationDTO>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }

        BigDecimal tempRange = new BigDecimal("2.0");
        BigDecimal minWaterTemp = waterTemp.subtract(tempRange);
        BigDecimal maxWaterTemp = waterTemp.add(tempRange);
        BigDecimal minAirTemp = airTemp.subtract(tempRange);
        BigDecimal maxAirTemp = airTemp.add(tempRange);

        List<Object[]> results;
        if (speciesId != null) {
            results = fishingRecordRepository.findTopLuresBySpeciesAndConditions(
                    speciesId, minWaterTemp, maxWaterTemp, minAirTemp, maxAirTemp);
        } else {
            results = fishingRecordRepository.findTopLuresByConditions(
                    minWaterTemp, maxWaterTemp, minAirTemp, maxAirTemp);
        }

        List<LureRecommendationDTO> recommendations = calculateRobustRecommendations(results);

        redisTemplate.opsForValue().set(cacheKey, recommendations, 1, TimeUnit.HOURS);
        return recommendations;
    }

    private List<LureRecommendationDTO> calculateRobustRecommendations(List<Object[]> results) {
        if (results.isEmpty()) {
            return new ArrayList<>();
        }

        long totalUsages = 0;
        long totalCatches = 0;
        long totalReleases = 0;
        for (Object[] row : results) {
            totalUsages += ((Number) row[1]).longValue();
            totalCatches += ((Number) row[2]).longValue();
            totalReleases += (row.length > 3 && row[3] != null) ? ((Number) row[3]).longValue() : 0;
        }
        double overallSuccessRate = totalUsages > 0 ? (double) totalCatches / totalUsages : 0.3;
        double overallReleaseRate = totalCatches > 0 ? (double) totalReleases / totalCatches : 0.0;

        List<LureRecommendationDTO> candidates = new ArrayList<>();
        
        for (Object[] row : results) {
            Long lureId = ((Number) row[0]).longValue();
            long usageCount = ((Number) row[1]).longValue();
            long totalCatch = ((Number) row[2]).longValue();
            long totalRelease = (row.length > 3 && row[3] != null) ? ((Number) row[3]).longValue() : 0;
            double rawSuccessRate = usageCount > 0 ? (double) totalCatch / usageCount : 0.0;
            double releaseRate = totalCatch > 0 ? (double) totalRelease / totalCatch : 0.0;

            double wilsonLowerBound = calculateWilsonLowerBound(totalCatch, usageCount);
            double ecoScore = calculateEcoScore(releaseRate, usageCount, overallReleaseRate);
            double weightedScore = calculateWeightedScore(
                    wilsonLowerBound, 
                    usageCount, 
                    rawSuccessRate,
                    overallSuccessRate,
                    ecoScore
            );

            LureRecommendationDTO dto = new LureRecommendationDTO();
            dto.setLureId(lureId);
            dto.setUsageCount(usageCount);
            dto.setCatchCount(totalCatch);
            dto.setReleaseCount(totalRelease);
            dto.setSuccessRate(weightedScore * 100);
            dto.setEcoScore(ecoScore * 100);
            dto.setEcoBadge(getEcoBadge(releaseRate));

            lureRepository.findById(lureId).ifPresent(lure -> {
                dto.setBrand(lure.getBrand());
                dto.setModel(lure.getModel());
                dto.setColor(lure.getColor());
                dto.setType(lure.getType());
                dto.setWeight(lure.getWeight());
            });

            candidates.add(dto);
        }

        candidates.sort((a, b) -> Double.compare(b.getSuccessRate(), a.getSuccessRate()));
        
        return candidates.stream()
                .limit(3)
                .collect(Collectors.toList());
    }

    private String getEcoBadge(double releaseRate) {
        if (releaseRate >= 0.8) return "🌍 生态卫士";
        if (releaseRate >= 0.5) return "🐟 放流达人";
        if (releaseRate >= 0.3) return "🌱 环保先锋";
        if (releaseRate > 0) return "💧 开始放流";
        return null;
    }

    private double calculateEcoScore(double releaseRate, long usageCount, double overallReleaseRate) {
        double baseScore = releaseRate;
        double sampleFactor = Math.min(usageCount / 10.0, 1.0);
        return baseScore * sampleFactor + overallReleaseRate * (1 - sampleFactor);
    }

    private double calculateAdjustedSuccessRate(long successes, long trials, double priorSuccessRate) {
        int pseudoSuccesses = 2;
        int pseudoTrials = 5;
        return (successes + pseudoSuccesses) / (double) (trials + pseudoTrials);
    }

    private double calculateWilsonLowerBound(long successes, long trials) {
        if (trials == 0) return 0.0;
        
        double z = 1.96;
        double p = (double) successes / trials;
        
        double denominator = 1 + (z * z) / trials;
        double firstTerm = p + (z * z) / (2 * trials);
        double secondTerm = z * Math.sqrt((p * (1 - p) / trials) + (z * z) / (4 * trials * trials));
        
        return (firstTerm - secondTerm) / denominator;
    }

    private double calculateWeightedScore(double wilsonLowerBound, long usageCount, 
                                           double rawSuccessRate, double overallRate, double ecoScore) {
        double confidenceScore = wilsonLowerBound;
        double sampleBonus = Math.min(usageCount / 10.0, 1.0) * 0.1;
        double rawBonus = (rawSuccessRate > overallRate) ? (rawSuccessRate - overallRate) * 0.2 : 0.0;
        
        double ecoBonus = ecoScore * ECO_BONUS_BASE;
        if (ecoScore > 0.7) {
            ecoBonus = Math.min(ecoBonus * 1.5, MAX_ECO_BONUS);
        }
        
        double finalScore = confidenceScore + sampleBonus + rawBonus + ecoBonus;
        
        if (usageCount < MIN_SAMPLE_THRESHOLD) {
            double penalty = 1.0 - (usageCount / (double) MIN_SAMPLE_THRESHOLD) * 0.5;
            finalScore *= penalty;
        }
        
        if (finalScore < MIN_SUCCESS_RATE && usageCount >= MIN_SAMPLE_THRESHOLD) {
            finalScore = MIN_SUCCESS_RATE;
        }
        
        return Math.max(0.0, Math.min(1.0, finalScore));
    }

    public List<HeatmapDataDTO> getMonthlySpeciesHeatmap() {
        List<HeatmapDataDTO> cached = (List<HeatmapDataDTO>) redisTemplate.opsForValue().get(HEATMAP_CACHE);
        if (cached != null) {
            return cached;
        }

        List<Object[]> rawData = fishingRecordRepository.findMonthlySpeciesHeatmap();
        List<HeatmapDataDTO> heatmapData = rawData.stream()
                .map(this::convertToHeatmapDTO)
                .collect(Collectors.toList());

        redisTemplate.opsForValue().set(HEATMAP_CACHE, heatmapData, 30, TimeUnit.MINUTES);
        return heatmapData;
    }

    private HeatmapDataDTO convertToHeatmapDTO(Object[] row) {
        Integer month = ((Number) row[0]).intValue();
        Long speciesId = ((Number) row[1]).longValue();
        Long count = ((Number) row[2]).longValue();

        HeatmapDataDTO dto = new HeatmapDataDTO();
        dto.setMonth(month);
        dto.setMonthName(getMonthName(month));
        dto.setSpeciesId(speciesId);
        dto.setCount(count);

        fishSpeciesRepository.findById(speciesId).ifPresent(species -> 
            dto.setSpeciesName(species.getName()));

        return dto;
    }

    private String getMonthName(int month) {
        String[] months = {"", "一月", "二月", "三月", "四月", "五月", "六月", 
                          "七月", "八月", "九月", "十月", "十一月", "十二月"};
        return months[month];
    }

    public List<FishSpecies> getAllFishSpecies() {
        return fishSpeciesRepository.findAll();
    }

    public List<Lure> getAllLures() {
        return lureRepository.findAll();
    }

    private void clearCache() {
        Set<String> keys = redisTemplate.keys(LURE_RECOMMENDATION_CACHE + "*");
        if (keys != null && !keys.isEmpty()) {
            redisTemplate.delete(keys);
        }
        redisTemplate.delete(HEATMAP_CACHE);
    }
}
