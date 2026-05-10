package com.disaster.relief.service;

import com.disaster.relief.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimelineService {

    public TimelineAnimationResult generateTimeline(TimelineAnimationRequest request) {
        int population = request.getAffectedPopulation();
        double multiplier = request.getConsumptionRateMultiplier() != null ? 
                           request.getConsumptionRateMultiplier() : 1.0;

        int dailyTent = (int) Math.ceil(population * 0.005 * multiplier);
        int dailyWater = (int) Math.ceil(population * 3.0 * multiplier);
        int dailyFood = (int) Math.ceil(population * 2.5 * multiplier);
        int dailyMedical = (int) Math.ceil(population * 0.02 * multiplier);

        SupplyRequirement initialStock = request.getInitialStock();
        int remainingTent = initialStock.getTentQuantity();
        int remainingWater = initialStock.getWaterQuantity();
        int remainingFood = initialStock.getFoodQuantity();
        int remainingMedical = initialStock.getMedicalKitQuantity();

        int days = request.getSimulationDays() != null ? request.getSimulationDays() : 30;

        List<SupplyDelivery> deliveries = request.getScheduledDeliveries() != null ? 
            request.getScheduledDeliveries() : new ArrayList<>();
        
        Map<Integer, List<SupplyDelivery>> deliveryMap = deliveries.stream()
            .collect(Collectors.groupingBy(SupplyDelivery::getDay));

        List<TimelineFrame> frames = new ArrayList<>();
        List<TimelineEvent> events = new ArrayList<>();
        Map<String, ShortageInfo> shortages = new LinkedHashMap<>();
        Map<String, Boolean> shortageReported = new HashMap<>();
        Map<String, Integer> shortageStartDay = new HashMap<>();

        int totalDeliveries = 0;

        for (int day = 1; day <= days; day++) {
            int deliveredTent = 0, deliveredWater = 0, deliveredFood = 0, deliveredMedical = 0;
            
            List<SupplyDelivery> dayDeliveries = deliveryMap.getOrDefault(day, new ArrayList<>());
            for (SupplyDelivery delivery : dayDeliveries) {
                SupplyRequirement s = delivery.getSupplies();
                deliveredTent += s.getTentQuantity() != null ? s.getTentQuantity() : 0;
                deliveredWater += s.getWaterQuantity() != null ? s.getWaterQuantity() : 0;
                deliveredFood += s.getFoodQuantity() != null ? s.getFoodQuantity() : 0;
                deliveredMedical += s.getMedicalKitQuantity() != null ? s.getMedicalKitQuantity() : 0;
                totalDeliveries++;
                
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("DELIVERY")
                    .amount(deliveredTent + deliveredWater + deliveredFood + deliveredMedical)
                    .description("物资补给到达：" + (delivery.getSource() != null ? delivery.getSource() : "未知来源"))
                    .level("success")
                    .build());
            }

            remainingTent += deliveredTent;
            remainingWater += deliveredWater;
            remainingFood += deliveredFood;
            remainingMedical += deliveredMedical;

            int consumedTent = Math.min(dailyTent, remainingTent);
            int consumedWater = Math.min(dailyWater, remainingWater);
            int consumedFood = Math.min(dailyFood, remainingFood);
            int consumedMedical = Math.min(dailyMedical, remainingMedical);

            remainingTent -= consumedTent;
            remainingWater -= consumedWater;
            remainingFood -= consumedFood;
            remainingMedical -= consumedMedical;

            String status = "NORMAL";
            List<String> statusMessages = new ArrayList<>();

            if (remainingTent <= dailyTent && remainingTent > 0 && !shortageReported.getOrDefault("tent_warning", false)) {
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("WARNING")
                    .supplyType("tent")
                    .description("帐篷库存即将耗尽，剩余仅够" + (remainingTent / Math.max(1, dailyTent)) + "天使用")
                    .level("warning")
                    .build());
                shortageReported.put("tent_warning", true);
            }
            if (remainingWater <= dailyWater * 2 && remainingWater > 0 && !shortageReported.getOrDefault("water_warning", false)) {
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("WARNING")
                    .supplyType("water")
                    .description("饮用水库存即将耗尽，剩余仅够" + (remainingWater / Math.max(1, dailyWater)) + "天使用")
                    .level("warning")
                    .build());
                shortageReported.put("water_warning", true);
            }
            if (remainingFood <= dailyFood * 2 && remainingFood > 0 && !shortageReported.getOrDefault("food_warning", false)) {
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("WARNING")
                    .supplyType("food")
                    .description("食物库存即将耗尽，剩余仅够" + (remainingFood / Math.max(1, dailyFood)) + "天使用")
                    .level("warning")
                    .build());
                shortageReported.put("food_warning", true);
            }
            if (remainingMedical <= dailyMedical && remainingMedical > 0 && !shortageReported.getOrDefault("medical_warning", false)) {
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("WARNING")
                    .supplyType("medical")
                    .description("医疗包库存即将耗尽，剩余仅够" + (remainingMedical / Math.max(1, dailyMedical)) + "天使用")
                    .level("warning")
                    .build());
                shortageReported.put("medical_warning", true);
            }

            if (remainingTent <= 0 && !shortages.containsKey("tent")) {
                shortages.put("tent", ShortageInfo.builder()
                    .supplyType("tent")
                    .shortageDay(day)
                    .shortageAmount(dailyTent - consumedTent)
                    .daysUntilShortage(day)
                    .build());
                shortageStartDay.put("tent", day);
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("SHORTAGE")
                    .supplyType("tent")
                    .amount(dailyTent - consumedTent)
                    .description("帐篷已断供，本日短缺" + (dailyTent - consumedTent) + "顶")
                    .level("danger")
                    .build());
                status = "CRITICAL";
                statusMessages.add("帐篷短缺");
            }
            if (remainingWater <= 0 && !shortages.containsKey("water")) {
                shortages.put("water", ShortageInfo.builder()
                    .supplyType("water")
                    .shortageDay(day)
                    .shortageAmount(dailyWater - consumedWater)
                    .daysUntilShortage(day)
                    .build());
                shortageStartDay.put("water", day);
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("SHORTAGE")
                    .supplyType("water")
                    .amount(dailyWater - consumedWater)
                    .description("饮用水已断供，本日短缺" + (dailyWater - consumedWater) + "升")
                    .level("danger")
                    .build());
                status = "CRITICAL";
                statusMessages.add("饮用水短缺");
            }
            if (remainingFood <= 0 && !shortages.containsKey("food")) {
                shortages.put("food", ShortageInfo.builder()
                    .supplyType("food")
                    .shortageDay(day)
                    .shortageAmount(dailyFood - consumedFood)
                    .daysUntilShortage(day)
                    .build());
                shortageStartDay.put("food", day);
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("SHORTAGE")
                    .supplyType("food")
                    .amount(dailyFood - consumedFood)
                    .description("食物已断供，本日短缺" + (dailyFood - consumedFood) + "份")
                    .level("danger")
                    .build());
                status = "CRITICAL";
                statusMessages.add("食物短缺");
            }
            if (remainingMedical <= 0 && !shortages.containsKey("medical")) {
                shortages.put("medical", ShortageInfo.builder()
                    .supplyType("medical")
                    .shortageDay(day)
                    .shortageAmount(dailyMedical - consumedMedical)
                    .daysUntilShortage(day)
                    .build());
                shortageStartDay.put("medical", day);
                events.add(TimelineEvent.builder()
                    .day(day)
                    .type("SHORTAGE")
                    .supplyType("medical")
                    .amount(dailyMedical - consumedMedical)
                    .description("医疗包已断供，本日短缺" + (dailyMedical - consumedMedical) + "个")
                    .level("danger")
                    .build());
                status = "CRITICAL";
                statusMessages.add("医疗包短缺");
            }

            if (!status.equals("CRITICAL")) {
                int warningCount = 0;
                if (remainingTent <= dailyTent * 3 && remainingTent > 0) warningCount++;
                if (remainingWater <= dailyWater * 3 && remainingWater > 0) warningCount++;
                if (remainingFood <= dailyFood * 3 && remainingFood > 0) warningCount++;
                if (remainingMedical <= dailyMedical * 3 && remainingMedical > 0) warningCount++;
                
                if (warningCount >= 2) {
                    status = "WARNING";
                }
            }

            String message = String.join("，", statusMessages);
            if (message.isEmpty()) {
                if (status.equals("WARNING")) {
                    message = "部分物资库存紧张";
                } else {
                    message = "物资供应正常";
                }
            }

            frames.add(TimelineFrame.builder()
                .day(day)
                .tentRemaining(remainingTent)
                .waterRemaining(remainingWater)
                .foodRemaining(remainingFood)
                .medicalKitRemaining(remainingMedical)
                .tentConsumed(consumedTent)
                .waterConsumed(consumedWater)
                .foodConsumed(consumedFood)
                .medicalKitConsumed(consumedMedical)
                .tentDelivered(deliveredTent)
                .waterDelivered(deliveredWater)
                .foodDelivered(deliveredFood)
                .medicalKitDelivered(deliveredMedical)
                .status(status)
                .message(message)
                .build());
        }

        return TimelineAnimationResult.builder()
            .frames(frames)
            .events(events)
            .dailyConsumptionRate(SupplyRequirement.builder()
                .tentQuantity(dailyTent)
                .waterQuantity(dailyWater)
                .foodQuantity(dailyFood)
                .medicalKitQuantity(dailyMedical)
                .build())
            .simulationDays(days)
            .shortages(shortages)
            .totalDeliveries(totalDeliveries)
            .build();
    }
}
