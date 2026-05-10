package com.company.watermonitor.service;

import com.company.watermonitor.dto.RestockRecommendationDTO;
import com.company.watermonitor.entity.WarehouseInventory;
import com.company.watermonitor.entity.WaterMachine;
import com.company.watermonitor.repository.WarehouseInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PredictionService {

    private final WarehouseInventoryRepository inventoryRepository;
    private final WaterMachineService machineService;

    @Value("${app.max-water-capacity:20}")
    private Double bottleCapacity;

    @Value("${app.prediction-hours:2}")
    private Integer predictionHours;

    public List<RestockRecommendationDTO> getRestockRecommendations() {
        log.info("[备水预测] 开始生成备水建议...");
        
        List<RestockRecommendationDTO> recommendations = new ArrayList<>();
        List<WarehouseInventory> allInventories = inventoryRepository.findAllByOrderByFloorAsc();
        List<WaterMachine> allMachines = machineService.getAllMachines();
        
        Map<Integer, List<WaterMachine>> machinesByFloor = new HashMap<>();
        for (WaterMachine machine : allMachines) {
            machinesByFloor.computeIfAbsent(machine.getFloor(), k -> new ArrayList<>()).add(machine);
        }
        
        for (WarehouseInventory inventory : allInventories) {
            RestockRecommendationDTO rec = generateRecommendationForFloor(inventory, machinesByFloor);
            recommendations.add(rec);
        }
        
        recommendations.sort((r1, r2) -> {
            int priority1 = getUrgencyPriority(r1.getUrgencyLevel());
            int priority2 = getUrgencyPriority(r2.getUrgencyLevel());
            if (priority1 != priority2) {
                return Integer.compare(priority1, priority2);
            }
            return Integer.compare(r1.getFloor(), r2.getFloor());
        });
        
        int urgentCount = (int) recommendations.stream()
                .filter(r -> "URGENT".equals(r.getUrgencyLevel()) || "HIGH".equals(r.getUrgencyLevel()))
                .count();
        log.info("[备水预测] 完成！生成 {} 条建议，其中紧急/高优先级: {} 条", 
                recommendations.size(), urgentCount);
        
        return recommendations;
    }

    public RestockRecommendationDTO generateRecommendationForFloor(
            WarehouseInventory inventory, 
            Map<Integer, List<WaterMachine>> machinesByFloor) {
        
        Integer floor = inventory.getFloor();
        List<WaterMachine> floorMachines = machinesByFloor.getOrDefault(floor, new ArrayList<>());
        
        double totalConsumptionRate = 0.0;
        for (WaterMachine machine : floorMachines) {
            double rate = machineService.calculateConsumptionRate(machine.getMachineId());
            totalConsumptionRate += rate;
        }
        
        double predictedConsumption2H = totalConsumptionRate * predictionHours;
        int bottlesNeeded2H = (int) Math.ceil(predictedConsumption2H / bottleCapacity);
        
        int stockAfter2H = inventory.getCurrentStock() - bottlesNeeded2H;
        
        String urgencyLevel = determineUrgency(inventory, stockAfter2H, bottlesNeeded2H);
        int recommendedQty = calculateRecommendedQuantity(inventory, stockAfter2H);
        LocalDateTime estimatedDepletionTime = calculateDepletionTime(
                inventory.getCurrentStock(), totalConsumptionRate);
        
        RestockRecommendationDTO rec = new RestockRecommendationDTO();
        rec.setFloor(floor);
        rec.setCurrentStock(inventory.getCurrentStock());
        rec.setMinStock(inventory.getMinStock());
        rec.setMaxStock(inventory.getMaxStock());
        rec.setPredictedConsumption2H(bottlesNeeded2H);
        rec.setStockAfter2H(Math.max(0, stockAfter2H));
        rec.setRecommendedQuantity(recommendedQty);
        rec.setUrgencyLevel(urgencyLevel);
        rec.setGeneratedTime(LocalDateTime.now());
        rec.setEstimatedDepletionTime(estimatedDepletionTime);
        rec.setStatus(determineStatus(urgencyLevel));
        rec.setMessage(generateMessage(inventory, floorMachines.size(), 
                totalConsumptionRate, urgencyLevel, recommendedQty));
        
        log.info("[备水预测] {}楼 - 当前库存:{}桶, 预计{}小时消耗:{}桶, 建议补充:{}桶, 紧急程度:{}",
                floor, inventory.getCurrentStock(), predictionHours, bottlesNeeded2H, 
                recommendedQty, urgencyLevel);
        
        return rec;
    }

    private String determineUrgency(WarehouseInventory inventory, int stockAfter2H, int predicted) {
        int current = inventory.getCurrentStock();
        int min = inventory.getMinStock();
        
        if (current <= 0) {
            return "CRITICAL";
        }
        
        if (current < min / 2) {
            return "URGENT";
        }
        
        if (stockAfter2H <= 0) {
            return "URGENT";
        }
        
        if (stockAfter2H < min) {
            return "HIGH";
        }
        
        if (current < min) {
            return "MEDIUM";
        }
        
        if (stockAfter2H < min * 1.5) {
            return "LOW";
        }
        
        return "NORMAL";
    }

    private int calculateRecommendedQuantity(WarehouseInventory inventory, int stockAfter2H) {
        if (stockAfter2H >= inventory.getMaxStock()) {
            return 0;
        }
        
        int needed = inventory.getMaxStock() - inventory.getCurrentStock();
        return Math.max(0, needed);
    }

    private LocalDateTime calculateDepletionTime(int currentStock, double consumptionRate) {
        if (consumptionRate <= 0 || currentStock <= 0) {
            return null;
        }
        
        double totalLiters = currentStock * bottleCapacity;
        double hoursToDeplete = totalLiters / consumptionRate;
        
        return LocalDateTime.now().plusHours((long) hoursToDeplete);
    }

    private String determineStatus(String urgencyLevel) {
        return switch (urgencyLevel) {
            case "CRITICAL", "URGENT" -> "ALERT";
            case "HIGH", "MEDIUM" -> "WARNING";
            default -> "NORMAL";
        };
    }

    private String generateMessage(WarehouseInventory inventory, int machineCount, 
                                   double consumptionRate, String urgencyLevel, int recommendedQty) {
        StringBuilder sb = new StringBuilder();
        sb.append(inventory.getFloor()).append("楼");
        
        switch (urgencyLevel) {
            case "CRITICAL" -> sb.append("库存已耗尽！");
            case "URGENT" -> sb.append("库存即将耗尽，需立即备货！");
            case "HIGH" -> sb.append("库存偏低，建议尽快备货。");
            case "MEDIUM" -> sb.append("库存略低，可考虑备货。");
            case "LOW" -> sb.append("未来2小时可能触及低库存线。");
            default -> sb.append("库存充足，暂无需备货。");
        }
        
        sb.append(" 该层");
        sb.append(machineCount).append("台饮水机");
        sb.append(String.format("，平均每小时消耗%.2f升", consumptionRate));
        sb.append(String.format("（约%.1f桶）", consumptionRate / bottleCapacity));
        
        if (recommendedQty > 0) {
            sb.append(String.format("。建议补充%d桶水。", recommendedQty));
        }
        
        return sb.toString();
    }

    private int getUrgencyPriority(String urgencyLevel) {
        return switch (urgencyLevel) {
            case "CRITICAL" -> 0;
            case "URGENT" -> 1;
            case "HIGH" -> 2;
            case "MEDIUM" -> 3;
            case "LOW" -> 4;
            default -> 5;
        };
    }

    public Map<String, Object> getOverallSummary() {
        List<RestockRecommendationDTO> recommendations = getRestockRecommendations();
        
        Map<String, Integer> byUrgency = new LinkedHashMap<>();
        byUrgency.put("CRITICAL", 0);
        byUrgency.put("URGENT", 0);
        byUrgency.put("HIGH", 0);
        byUrgency.put("MEDIUM", 0);
        byUrgency.put("LOW", 0);
        byUrgency.put("NORMAL", 0);
        
        int totalStock = 0;
        int totalMin = 0;
        int totalRecommended = 0;
        
        for (RestockRecommendationDTO rec : recommendations) {
            String urgency = rec.getUrgencyLevel();
            byUrgency.put(urgency, byUrgency.getOrDefault(urgency, 0) + 1);
            
            totalStock += rec.getCurrentStock();
            totalMin += rec.getMinStock();
            totalRecommended += rec.getRecommendedQuantity();
        }
        
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalFloors", recommendations.size());
        summary.put("totalStock", totalStock);
        summary.put("totalMinStock", totalMin);
        summary.put("totalRecommendedQty", totalRecommended);
        summary.put("byUrgency", byUrgency);
        summary.put("generatedAt", LocalDateTime.now());
        
        return summary;
    }
}
