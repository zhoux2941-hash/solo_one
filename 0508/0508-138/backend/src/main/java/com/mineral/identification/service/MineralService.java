package com.mineral.identification.service;

import com.mineral.identification.dto.IdentificationConfirmationRequest;
import com.mineral.identification.dto.MineralIdentificationRequest;
import com.mineral.identification.dto.MineralMatchResult;
import com.mineral.identification.entity.IdentificationRecord;
import com.mineral.identification.entity.Mineral;
import com.mineral.identification.entity.MineralFeature;
import com.mineral.identification.repository.IdentificationRecordRepository;
import com.mineral.identification.repository.MineralFeatureRepository;
import com.mineral.identification.repository.MineralRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.servlet.http.HttpServletRequest;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class MineralService {
    
    private final MineralRepository mineralRepository;
    private final MineralFeatureRepository mineralFeatureRepository;
    private final IdentificationRecordRepository identificationRecordRepository;
    
    private static final double HARDNESS_TOLERANCE = 0.5;
    private static final double HARDNESS_WEIGHT = 0.30;
    private static final double STREAK_WEIGHT = 0.25;
    private static final double LUSTER_WEIGHT = 0.25;
    private static final double CLEAVAGE_WEIGHT = 0.20;
    private static final int MAX_RESULTS = 5;
    
    private static final double FEATURE_PENALTY_1 = 0.30;
    private static final double FEATURE_PENALTY_2 = 0.60;
    private static final double FEATURE_PENALTY_3 = 0.85;
    private static final double FEATURE_PENALTY_4 = 1.00;
    
    private static final double MIN_MATCH_SCORE_THRESHOLD = 10.0;
    
    @Cacheable(value = "minerals", key = "'all'")
    public List<Mineral> getAllMinerals() {
        log.info("从数据库获取所有矿物");
        return mineralRepository.findAllWithFeatures();
    }
    
    @Cacheable(value = "minerals", key = "#id")
    public Mineral getMineralById(Long id) {
        return mineralRepository.findByIdWithFeatures(id);
    }
    
    @Transactional(readOnly = true)
    public List<MineralMatchResult> identifyMinerals(MineralIdentificationRequest request) {
        log.info("开始矿物鉴定，请求参数: {}", request);
        
        int filledFeaturesCount = countFilledFeatures(request);
        log.info("用户填写了 {} 个特征", filledFeaturesCount);
        
        List<Mineral> allMinerals = getAllMinerals();
        
        List<MineralMatchResult> results = allMinerals.stream()
            .map(mineral -> calculateMatchScore(mineral, request, filledFeaturesCount))
            .filter(result -> result.getMatchScore() >= MIN_MATCH_SCORE_THRESHOLD)
            .sorted(Comparator.comparing(MineralMatchResult::getMatchScore).reversed())
            .limit(MAX_RESULTS)
            .collect(Collectors.toList());
        
        log.info("鉴定完成，找到 {} 个匹配的矿物", results.size());
        return results;
    }
    
    private int countFilledFeatures(MineralIdentificationRequest request) {
        int count = 0;
        if (request.getHardness() != null) count++;
        if (request.getStreak() != null && !request.getStreak().isEmpty()) count++;
        if (request.getLuster() != null && !request.getLuster().isEmpty()) count++;
        if (request.getCleavage() != null && !request.getCleavage().isEmpty()) count++;
        return count;
    }
    
    private double getFeaturePenalty(int featureCount) {
        switch (featureCount) {
            case 1: return FEATURE_PENALTY_1;
            case 2: return FEATURE_PENALTY_2;
            case 3: return FEATURE_PENALTY_3;
            case 4: return FEATURE_PENALTY_4;
            default: return 0.0;
        }
    }
    
    private MineralMatchResult calculateMatchScore(Mineral mineral, MineralIdentificationRequest request, int filledFeaturesCount) {
        double totalScore = 0.0;
        
        Map<String, List<MineralFeature>> featuresByType = mineral.getFeatures().stream()
            .collect(Collectors.groupingBy(MineralFeature::getFeatureType));
        
        if (request.getHardness() != null) {
            double hardnessScore = calculateHardnessScore(
                request.getHardness(), 
                featuresByType.getOrDefault("hardness", Collections.emptyList())
            );
            totalScore += hardnessScore * HARDNESS_WEIGHT * 100;
        }
        
        if (request.getStreak() != null && !request.getStreak().isEmpty()) {
            double streakScore = calculateFeatureScore(
                request.getStreak(),
                "streak",
                featuresByType
            );
            totalScore += streakScore * STREAK_WEIGHT * 100;
        }
        
        if (request.getLuster() != null && !request.getLuster().isEmpty()) {
            double lusterScore = calculateFeatureScore(
                request.getLuster(),
                "luster",
                featuresByType
            );
            totalScore += lusterScore * LUSTER_WEIGHT * 100;
        }
        
        if (request.getCleavage() != null && !request.getCleavage().isEmpty()) {
            double cleavageScore = calculateFeatureScore(
                request.getCleavage(),
                "cleavage",
                featuresByType
            );
            totalScore += cleavageScore * CLEAVAGE_WEIGHT * 100;
        }
        
        double featurePenalty = getFeaturePenalty(filledFeaturesCount);
        double finalScore = totalScore * featurePenalty;
        
        String matchPercentage = String.format("%.1f%%", finalScore);
        
        return MineralMatchResult.builder()
            .id(mineral.getId())
            .name(mineral.getName())
            .nameCn(mineral.getNameCn())
            .chemicalFormula(mineral.getChemicalFormula())
            .typicalLocation(mineral.getTypicalLocation())
            .imageUrl(mineral.getImageUrl())
            .description(mineral.getDescription())
            .matchScore(finalScore)
            .matchPercentage(matchPercentage)
            .build();
    }
    
    private double calculateHardnessScore(BigDecimal inputHardness, List<MineralFeature> hardnessFeatures) {
        if (hardnessFeatures.isEmpty()) {
            return 0.0;
        }
        
        for (MineralFeature feature : hardnessFeatures) {
            double featureHardness = Double.parseDouble(feature.getFeatureValue());
            double inputHardnessValue = inputHardness.doubleValue();
            double diff = Math.abs(featureHardness - inputHardnessValue);
            
            if (diff <= HARDNESS_TOLERANCE) {
                double score = 1.0 - (diff / (HARDNESS_TOLERANCE * 2));
                return score * feature.getWeight().doubleValue();
            }
        }
        
        return 0.0;
    }
    
    private double calculateFeatureScore(String inputValue, String featureType, 
                                         Map<String, List<MineralFeature>> featuresByType) {
        List<MineralFeature> features = featuresByType.getOrDefault(featureType, Collections.emptyList());
        
        for (MineralFeature feature : features) {
            if (feature.getFeatureValue().equalsIgnoreCase(inputValue) ||
                feature.getFeatureValue().contains(inputValue.toLowerCase())) {
                return feature.getWeight().doubleValue();
            }
        }
        
        return 0.0;
    }
    
    @Transactional
    @CacheEvict(value = "minerals", allEntries = true)
    public boolean confirmIdentification(IdentificationConfirmationRequest request, HttpServletRequest httpRequest) {
        log.info("收到鉴定确认请求: {}", request);
        
        IdentificationRecord record = new IdentificationRecord();
        record.setConfirmedMineralId(request.getConfirmedMineralId());
        record.setInputHardness(request.getInputHardness());
        record.setInputStreak(request.getInputStreak());
        record.setInputLuster(request.getInputLuster());
        record.setInputCleavage(request.getInputCleavage());
        record.setIpAddress(getClientIp(httpRequest));
        
        identificationRecordRepository.save(record);
        
        updateFeatureWeights(request);
        
        log.info("鉴定确认已记录，矿物ID: {}", request.getConfirmedMineralId());
        return true;
    }
    
    private void updateFeatureWeights(IdentificationConfirmationRequest request) {
        Long mineralId = request.getConfirmedMineralId();
        BigDecimal weightDelta = new BigDecimal("0.01");
        
        if (request.getInputHardness() != null) {
            mineralFeatureRepository.updateFeatureWeight(
                mineralId, 
                "hardness", 
                request.getInputHardness().toString(),
                weightDelta
            );
        }
        
        if (request.getInputStreak() != null && !request.getInputStreak().isEmpty()) {
            mineralFeatureRepository.updateFeatureWeight(
                mineralId, 
                "streak", 
                request.getInputStreak(),
                weightDelta
            );
        }
        
        if (request.getInputLuster() != null && !request.getInputLuster().isEmpty()) {
            mineralFeatureRepository.updateFeatureWeight(
                mineralId, 
                "luster", 
                request.getInputLuster(),
                weightDelta
            );
        }
        
        if (request.getInputCleavage() != null && !request.getInputCleavage().isEmpty()) {
            mineralFeatureRepository.updateFeatureWeight(
                mineralId, 
                "cleavage", 
                request.getInputCleavage(),
                weightDelta
            );
        }
    }
    
    private String getClientIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_CLIENT_IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("HTTP_X_FORWARDED_FOR");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        return ip;
    }
}
