package com.graftingassistant.algorithm;

import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class BayesianAverageCalculator {
    
    private static final int MIN_RECORDS = 5;
    private static final double MAX_SINGLE_RECORD_WEIGHT = 0.10;
    private static final double OUTLIER_THRESHOLD = 2.0;
    private static final double TRUST_DECAY_FACTOR = 0.5;
    
    public int calculateBayesianScore(int initialScore, List<BigDecimal> allSurvivalRates) {
        if (allSurvivalRates == null || allSurvivalRates.isEmpty()) {
            return initialScore;
        }
        
        List<BigDecimal> filteredRates = filterOutliers(allSurvivalRates);
        
        if (filteredRates.isEmpty()) {
            return initialScore;
        }
        
        double priorMean = initialScore / 100.0;
        int totalRecords = filteredRates.size();
        
        BigDecimal weightedSum = BigDecimal.ZERO;
        double totalWeight = 0;
        
        for (int i = 0; i < filteredRates.size(); i++) {
            BigDecimal rate = filteredRates.get(i);
            double weight = calculateRecordWeight(i, totalRecords);
            
            weightedSum = weightedSum.add(rate.multiply(BigDecimal.valueOf(weight)));
            totalWeight += weight;
        }
        
        double observationMean = totalWeight > 0 
            ? weightedSum.divide(BigDecimal.valueOf(totalWeight), 4, RoundingMode.HALF_UP).doubleValue() / 100.0
            : 0;
        
        int priorWeight = calculatePriorWeight(totalRecords);
        
        double bayesianMean = (priorWeight * priorMean + totalWeight * observationMean) 
                            / (priorWeight + totalWeight);
        
        int score = (int) Math.round(bayesianMean * 100);
        
        return Math.max(0, Math.min(100, score));
    }
    
    private List<BigDecimal> filterOutliers(List<BigDecimal> rates) {
        if (rates.size() < 4) {
            return new ArrayList<>(rates);
        }
        
        List<Double> doubleRates = new ArrayList<>();
        for (BigDecimal rate : rates) {
            doubleRates.add(rate.doubleValue());
        }
        
        Collections.sort(doubleRates);
        
        int n = doubleRates.size();
        double q1 = doubleRates.get(n / 4);
        double q3 = doubleRates.get(3 * n / 4);
        double iqr = q3 - q1;
        
        double lowerBound = q1 - OUTLIER_THRESHOLD * iqr;
        double upperBound = q3 + OUTLIER_THRESHOLD * iqr;
        
        List<BigDecimal> filtered = new ArrayList<>();
        for (BigDecimal rate : rates) {
            double val = rate.doubleValue();
            if (val >= lowerBound && val <= upperBound) {
                filtered.add(rate);
            }
        }
        
        return filtered;
    }
    
    private double calculateRecordWeight(int index, int totalRecords) {
        double maxWeight = Math.min(MAX_SINGLE_RECORD_WEIGHT, 1.0 / Math.max(1, totalRecords * TRUST_DECAY_FACTOR));
        return maxWeight;
    }
    
    private int calculatePriorWeight(int totalRecords) {
        if (totalRecords <= MIN_RECORDS) {
            return MIN_RECORDS;
        }
        
        double logFactor = Math.log10(totalRecords + 1);
        return (int) Math.round(MIN_RECORDS + logFactor * 2);
    }
    
    public BigDecimal calculateSurvivalRate(Integer survivalCount, Integer totalCount) {
        if (survivalCount == null || totalCount == null || totalCount == 0) {
            return null;
        }
        
        return BigDecimal.valueOf(survivalCount * 100.0 / totalCount)
                        .setScale(2, RoundingMode.HALF_UP);
    }
}
