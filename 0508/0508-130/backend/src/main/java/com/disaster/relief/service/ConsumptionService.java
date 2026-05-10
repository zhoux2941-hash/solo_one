package com.disaster.relief.service;

import com.disaster.relief.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class ConsumptionService {

    public ConsumptionResult simulate(ConsumptionRequest request) {
        int population = request.getAffectedPopulation();
        double multiplier = request.getConsumptionRateMultiplier() != null ? 
                           request.getConsumptionRateMultiplier() : 1.0;

        int dailyTent = (int) Math.ceil(population * 0.005 * multiplier);
        int dailyWater = (int) Math.ceil(population * 3.0 * multiplier);
        int dailyFood = (int) Math.ceil(population * 2.5 * multiplier);
        int dailyMedical = (int) Math.ceil(population * 0.02 * multiplier);

        SupplyRequirement initialStock = request.getInitialStock();
        int tent = initialStock.getTentQuantity();
        int water = initialStock.getWaterQuantity();
        int food = initialStock.getFoodQuantity();
        int medical = initialStock.getMedicalKitQuantity();

        int days = request.getSimulationDays() != null ? request.getSimulationDays() : 30;

        List<DailyConsumption> dailyList = new ArrayList<>();
        Map<String, ShortageInfo> shortages = new LinkedHashMap<>();

        int remainingTent = tent;
        int remainingWater = water;
        int remainingFood = food;
        int remainingMedical = medical;

        for (int day = 1; day <= days; day++) {
            int consumedTent = Math.min(dailyTent, remainingTent);
            int consumedWater = Math.min(dailyWater, remainingWater);
            int consumedFood = Math.min(dailyFood, remainingFood);
            int consumedMedical = Math.min(dailyMedical, remainingMedical);

            remainingTent -= consumedTent;
            remainingWater -= consumedWater;
            remainingFood -= consumedFood;
            remainingMedical -= consumedMedical;

            dailyList.add(DailyConsumption.builder()
                .day(day)
                .tentRemaining(remainingTent)
                .waterRemaining(remainingWater)
                .foodRemaining(remainingFood)
                .medicalKitRemaining(remainingMedical)
                .tentConsumed(consumedTent)
                .waterConsumed(consumedWater)
                .foodConsumed(consumedFood)
                .medicalKitConsumed(consumedMedical)
                .build());

            if (remainingTent <= 0 && !shortages.containsKey("tent")) {
                shortages.put("tent", ShortageInfo.builder()
                    .supplyType("tent")
                    .shortageDay(day)
                    .shortageAmount(dailyTent - consumedTent)
                    .daysUntilShortage(day)
                    .build());
            }
            if (remainingWater <= 0 && !shortages.containsKey("water")) {
                shortages.put("water", ShortageInfo.builder()
                    .supplyType("water")
                    .shortageDay(day)
                    .shortageAmount(dailyWater - consumedWater)
                    .daysUntilShortage(day)
                    .build());
            }
            if (remainingFood <= 0 && !shortages.containsKey("food")) {
                shortages.put("food", ShortageInfo.builder()
                    .supplyType("food")
                    .shortageDay(day)
                    .shortageAmount(dailyFood - consumedFood)
                    .daysUntilShortage(day)
                    .build());
            }
            if (remainingMedical <= 0 && !shortages.containsKey("medical")) {
                shortages.put("medical", ShortageInfo.builder()
                    .supplyType("medical")
                    .shortageDay(day)
                    .shortageAmount(dailyMedical - consumedMedical)
                    .daysUntilShortage(day)
                    .build());
            }
        }

        return ConsumptionResult.builder()
            .dailyConsumptions(dailyList)
            .shortages(shortages)
            .simulationDays(days)
            .dailyConsumptionRate(SupplyRequirement.builder()
                .tentQuantity(dailyTent)
                .waterQuantity(dailyWater)
                .foodQuantity(dailyFood)
                .medicalKitQuantity(dailyMedical)
                .build())
            .build();
    }

    public Map<String, Object> comparePlans(List<AllocationResult> plans) {
        if (plans == null || plans.size() < 2) {
            throw new IllegalArgumentException("至少需要两个方案进行对比");
        }

        Map<String, Object> comparison = new LinkedHashMap<>();
        List<Map<String, Object>> planDetails = new ArrayList<>();

        for (int i = 0; i < plans.size(); i++) {
            AllocationResult plan = plans.get(i);
            Map<String, Object> detail = new LinkedHashMap<>();
            detail.put("planIndex", i + 1);
            detail.put("algorithm", plan.getAlgorithm());
            detail.put("satisfactionRate", plan.getSatisfactionRate());
            detail.put("totalCost", plan.getTotalCost());
            detail.put("unmetRequirements", plan.getUnmetRequirements());
            detail.put("pointAllocations", plan.getAllocations());
            planDetails.add(detail);
        }

        comparison.put("plans", planDetails);

        AllocationResult bestBySatisfaction = plans.stream()
            .max(Comparator.comparing(AllocationResult::getSatisfactionRate))
            .orElse(null);
        AllocationResult bestByCost = plans.stream()
            .min(Comparator.comparing(AllocationResult::getTotalCost))
            .orElse(null);

        Map<String, Object> recommendations = new LinkedHashMap<>();
        if (bestBySatisfaction != null) {
            recommendations.put("bestSatisfaction", Map.of(
                "algorithm", bestBySatisfaction.getAlgorithm(),
                "rate", bestBySatisfaction.getSatisfactionRate()
            ));
        }
        if (bestByCost != null) {
            recommendations.put("bestCost", Map.of(
                "algorithm", bestByCost.getAlgorithm(),
                "cost", bestByCost.getTotalCost()
            ));
        }
        comparison.put("recommendations", recommendations);

        if (plans.size() >= 2) {
            AllocationResult p1 = plans.get(0);
            AllocationResult p2 = plans.get(1);
            
            Map<String, Object> diff = new LinkedHashMap<>();
            diff.put("satisfactionDiff", p2.getSatisfactionRate() - p1.getSatisfactionRate());
            diff.put("costDiff", p2.getTotalCost() - p1.getTotalCost());
            diff.put("satisfactionImprovement", 
                p1.getSatisfactionRate() > 0 ? 
                ((p2.getSatisfactionRate() - p1.getSatisfactionRate()) / p1.getSatisfactionRate() * 100) : 0);
            comparison.put("comparison", diff);
        }

        return comparison;
    }
}
