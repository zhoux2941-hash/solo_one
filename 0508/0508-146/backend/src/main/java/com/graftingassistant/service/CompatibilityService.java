package com.graftingassistant.service;

import com.graftingassistant.algorithm.BayesianAverageCalculator;
import com.graftingassistant.entity.CompatibilityScore;
import com.graftingassistant.entity.GraftingCompatibility;
import com.graftingassistant.entity.GraftingRecord;
import com.graftingassistant.entity.Plant;
import com.graftingassistant.repository.CompatibilityScoreRepository;
import com.graftingassistant.repository.GraftingCompatibilityRepository;
import com.graftingassistant.repository.GraftingRecordRepository;
import com.graftingassistant.repository.PlantRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CompatibilityService {
    
    private final GraftingCompatibilityRepository compatibilityRepository;
    private final CompatibilityScoreRepository scoreRepository;
    private final GraftingRecordRepository recordRepository;
    private final PlantRepository plantRepository;
    private final BayesianAverageCalculator bayesianCalculator;
    
    private static final int MAX_RECORDS_FOR_CALCULATION = 100;
    
    @Cacheable(value = "compatibility", key = "#rootstockId + '-' + #scionId")
    public Integer getCompatibilityScore(Long rootstockId, Long scionId) {
        Optional<CompatibilityScore> scoreOpt = scoreRepository.findByRootstockIdAndScionId(rootstockId, scionId);
        if (scoreOpt.isPresent()) {
            return scoreOpt.get().getBayesianScore();
        }
        
        Optional<GraftingCompatibility> compatibilityOpt = 
            compatibilityRepository.findByRootstockIdAndScionId(rootstockId, scionId);
        
        return compatibilityOpt
            .map(GraftingCompatibility::getInitialScore)
            .orElse(50);
    }
    
    @Transactional
    @CacheEvict(value = "compatibility", key = "#rootstockId + '-' + #scionId")
    public void updateCompatibilityScore(Long rootstockId, Long scionId) {
        List<GraftingRecord> completedRecords = 
            recordRepository.findByRootstockIdAndScionIdAndIsCompletedTrue(rootstockId, scionId);
        
        Optional<GraftingCompatibility> compatibilityOpt = 
            compatibilityRepository.findByRootstockIdAndScionId(rootstockId, scionId);
        
        int initialScore = compatibilityOpt
            .map(GraftingCompatibility::getInitialScore)
            .orElse(50);
        
        List<BigDecimal> allSurvivalRates = new ArrayList<>();
        BigDecimal totalSurvivalRate = BigDecimal.ZERO;
        
        int recordCount = Math.min(completedRecords.size(), MAX_RECORDS_FOR_CALCULATION);
        
        for (int i = 0; i < recordCount; i++) {
            GraftingRecord record = completedRecords.get(i);
            if (record.getSurvivalRate() != null) {
                allSurvivalRates.add(record.getSurvivalRate());
                totalSurvivalRate = totalSurvivalRate.add(record.getSurvivalRate());
            }
        }
        
        int totalRecords = allSurvivalRates.size();
        BigDecimal averageSurvivalRate = totalRecords > 0 
            ? totalSurvivalRate.divide(BigDecimal.valueOf(totalRecords), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;
        
        int bayesianScore = bayesianCalculator.calculateBayesianScore(
            initialScore, allSurvivalRates);
        
        CompatibilityScore score = scoreRepository.findByRootstockIdAndScionId(rootstockId, scionId)
            .orElseGet(() -> {
                CompatibilityScore newScore = new CompatibilityScore();
                Plant rootstock = plantRepository.getReferenceById(rootstockId);
                Plant scion = plantRepository.getReferenceById(scionId);
                newScore.setRootstock(rootstock);
                newScore.setScion(scion);
                return newScore;
            });
        
        score.setBayesianScore(bayesianScore);
        score.setTotalRecords(totalRecords);
        score.setTotalSurvivalRate(totalSurvivalRate);
        score.setAverageSurvivalRate(averageSurvivalRate);
        
        scoreRepository.save(score);
    }
}
