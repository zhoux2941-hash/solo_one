package com.petboarding.service;

import com.petboarding.entity.PriceAdjustmentLog;
import com.petboarding.entity.PriceAdjustmentRule;
import com.petboarding.entity.Room;
import com.petboarding.repository.PriceAdjustmentLogRepository;
import com.petboarding.repository.PriceAdjustmentRuleRepository;
import com.petboarding.repository.RoomRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class PriceSuggestionService {
    
    private final OccupancyPredictionService predictionService;
    private final PriceAdjustmentLogRepository logRepository;
    private final PriceAdjustmentRuleRepository ruleRepository;
    private final RoomRepository roomRepository;
    
    private static final BigDecimal LOWER_THRESHOLD = new BigDecimal("30.00");
    private static final BigDecimal UPPER_THRESHOLD = new BigDecimal("90.00");
    private static final BigDecimal DECREASE_PERCENTAGE = new BigDecimal("-10.00");
    private static final BigDecimal INCREASE_PERCENTAGE = new BigDecimal("5.00");
    
    public List<PriceSuggestionResult> generatePriceSuggestions() {
        LocalDate startDate = LocalDate.now().plusDays(1);
        LocalDate endDate = LocalDate.now().plusDays(7);
        return generatePriceSuggestions(startDate, endDate);
    }
    
    public List<PriceSuggestionResult> generatePriceSuggestions(LocalDate startDate, LocalDate endDate) {
        List<PriceSuggestionResult> suggestions = new ArrayList<>();
        
        List<String> roomTypes = roomRepository.findAllRoomTypes();
        
        for (String roomType : roomTypes) {
            Map<String, Object> prediction = predictionService.predictRoomTypeOccupancy(
                    roomType, startDate, endDate);
            
            BigDecimal avgPredictedRate = BigDecimal.valueOf((Double) prediction.get("averagePredictedRate"));
            
            PriceAdjustmentRule matchedRule = findMatchingRule(avgPredictedRate);
            
            if (matchedRule != null) {
                List<Room> rooms = roomRepository.findByRoomType(roomType);
                for (Room room : rooms) {
                    PriceSuggestionResult suggestion = buildSuggestion(
                            room, avgPredictedRate, matchedRule, startDate, endDate);
                    if (suggestion != null) {
                        suggestions.add(suggestion);
                    }
                }
            }
        }
        
        log.info("Generated {} price suggestions for date range {} - {}", 
                suggestions.size(), startDate, endDate);
        
        return suggestions;
    }
    
    private PriceAdjustmentRule findMatchingRule(BigDecimal occupancyRate) {
        List<PriceAdjustmentRule> rules = ruleRepository.findByIsActiveTrueOrderByPriorityDesc();
        
        if (rules.isEmpty()) {
            return buildDefaultRule(occupancyRate);
        }
        
        for (PriceAdjustmentRule rule : rules) {
            if (rule.getLowerThreshold() != null && 
                occupancyRate.compareTo(rule.getLowerThreshold()) >= 0) {
                return rule;
            }
            if (rule.getUpperThreshold() != null && 
                occupancyRate.compareTo(rule.getUpperThreshold()) < 0) {
                return rule;
            }
        }
        
        return null;
    }
    
    private PriceAdjustmentRule buildDefaultRule(BigDecimal occupancyRate) {
        if (occupancyRate.compareTo(LOWER_THRESHOLD) < 0) {
            return PriceAdjustmentRule.builder()
                    .ruleName("默认低价促销")
                    .ruleType(PriceAdjustmentRule.RuleType.OCCUPANCY_BASED)
                    .upperThreshold(LOWER_THRESHOLD)
                    .adjustmentPercentage(DECREASE_PERCENTAGE)
                    .priority(1)
                    .isActive(true)
                    .build();
        }
        
        if (occupancyRate.compareTo(UPPER_THRESHOLD) > 0) {
            return PriceAdjustmentRule.builder()
                    .ruleName("默认旺季涨价")
                    .ruleType(PriceAdjustmentRule.RuleType.OCCUPANCY_BASED)
                    .lowerThreshold(UPPER_THRESHOLD)
                    .adjustmentPercentage(INCREASE_PERCENTAGE)
                    .priority(2)
                    .isActive(true)
                    .build();
        }
        
        return null;
    }
    
    private PriceSuggestionResult buildSuggestion(
            Room room, 
            BigDecimal occupancyRate, 
            PriceAdjustmentRule rule,
            LocalDate startDate,
            LocalDate endDate) {
        
        BigDecimal originalPrice = room.getPricePerDay();
        BigDecimal adjustmentPercentage = rule.getAdjustmentPercentage();
        
        BigDecimal priceChange = originalPrice
                .multiply(adjustmentPercentage)
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        
        BigDecimal adjustedPrice = originalPrice.add(priceChange);
        
        PriceAdjustmentLog.AdjustmentType adjustmentType = 
                adjustmentPercentage.compareTo(BigDecimal.ZERO) > 0 
                        ? PriceAdjustmentLog.AdjustmentType.INCREASE 
                        : PriceAdjustmentLog.AdjustmentType.DECREASE;
        
        String reason = buildReason(occupancyRate, adjustmentType, adjustmentPercentage);
        
        return PriceSuggestionResult.builder()
                .roomId(room.getRoomId())
                .roomType(room.getRoomType())
                .roomTypeName(getRoomTypeName(room.getRoomType()))
                .roomName(room.getName())
                .originalPrice(originalPrice)
                .adjustedPrice(adjustedPrice)
                .adjustmentType(adjustmentType.name())
                .adjustmentPercentage(adjustmentPercentage)
                .occupancyRate(occupancyRate)
                .reason(reason)
                .startDate(startDate)
                .endDate(endDate)
                .ruleName(rule.getRuleName())
                .build();
    }
    
    private String buildReason(BigDecimal occupancyRate, 
                           PriceAdjustmentLog.AdjustmentType type,
                           BigDecimal percentage) {
        if (type == PriceAdjustmentLog.AdjustmentType.DECREASE) {
            return String.format("预测入住率 %.2f%% 低于30%%，建议降价 %.2f%%", 
                    occupancyRate, percentage.abs());
        } else {
            return String.format("预测入住率 %.2f%% 高于90%%，建议涨价 %.2f%%", 
                    occupancyRate, percentage);
        }
    }
    
    @Transactional
    public PriceAdjustmentLog saveSuggestion(PriceSuggestionResult suggestion) {
        PriceAdjustmentLog log = PriceAdjustmentLog.builder()
                .roomId(suggestion.getRoomId())
                .roomType(suggestion.getRoomType())
                .originalPrice(suggestion.getOriginalPrice())
                .adjustedPrice(suggestion.getAdjustedPrice())
                .adjustmentType(PriceAdjustmentLog.AdjustmentType.valueOf(suggestion.getAdjustmentType()))
                .adjustmentPercentage(suggestion.getAdjustmentPercentage())
                .reason(suggestion.getReason())
                .occupancyRate(suggestion.getOccupancyRate())
                .startDate(suggestion.getStartDate())
                .endDate(suggestion.getEndDate())
                .status(PriceAdjustmentLog.AdjustmentStatus.SUGGESTED)
                .build();
        
        return logRepository.save(log);
        
        log.info("Saved price suggestion: roomId={}, from={}, to={}", 
                suggestion.getRoomId(), suggestion.getOriginalPrice(), suggestion.getAdjustedPrice());
        
        return log;
    }
    
    @Transactional
    public List<PriceAdjustmentLog> applyAdjustment(Long adjustmentId, Long appliedBy) {
        PriceAdjustmentLog adjustment = logRepository.findById(adjustmentId)
                .orElseThrow(() -> new RuntimeException("Adjustment not found"));
        
        if (adjustment.getStatus() != PriceAdjustmentLog.AdjustmentStatus.SUGGESTED) {
            throw new RuntimeException("Only suggested adjustments can be applied");
        }
        
        Room room = roomRepository.findById(adjustment.getRoomId())
                .orElseThrow(() -> new RuntimeException("Room not found"));
        
        room.setPricePerDay(adjustment.getAdjustedPrice());
        roomRepository.save(room);
        
        adjustment.setStatus(PriceAdjustmentLog.AdjustmentStatus.APPLIED);
        adjustment.setAppliedBy(appliedBy);
        adjustment.setAppliedAt(LocalDateTime.now());
        logRepository.save(adjustment);
        
        log.info("Applied price adjustment: roomId={}, newPrice={}", 
                adjustment.getRoomId(), adjustment.getAdjustedPrice());
        
        return adjustment;
    }
    
    @Transactional
    public PriceAdjustmentLog cancelAdjustment(Long adjustmentId) {
        PriceAdjustmentLog adjustment = logRepository.findById(adjustmentId)
                .orElseThrow(() -> new RuntimeException("Adjustment not found"));
        
        if (adjustment.getStatus() == PriceAdjustmentLog.AdjustmentStatus.CANCELLED) {
            throw new RuntimeException("Adjustment is already cancelled"));
        }
        
        adjustment.setStatus(PriceAdjustmentLog.AdjustmentStatus.CANCELLED);
        logRepository.save(adjustment);
        
        log.info("Cancelled price adjustment: adjustmentId={}", adjustmentId);
        
        return adjustment;
    }
    
    public List<PriceAdjustmentLog> getSuggestionsByStatus(PriceAdjustmentLog.AdjustmentStatus status) {
        return logRepository.findByStatus(status);
    }
    
    public List<PriceAdjustmentLog> getAllSuggestions() {
        return logRepository.findAll();
    }
    
    public Map<String, Object> getPriceTrendData(String roomType, LocalDate startDate, LocalDate endDate) {
        Map<String, Object> result = new LinkedHashMap<>();
        
        Map<String, Object> prediction = predictionService.predictRoomTypeOccupancy(roomType, startDate, endDate);
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> dailyPredictions = (List<Map<String, Object>>) prediction.get("dailyPredictions");
        
        List<Map<String, Object>> trendData = new ArrayList<>();
        for (Map<String, Object> dayData : dailyPredictions) {
            LocalDate date = (LocalDate) dayData.get("date");
            Double rate = (Double) dayData.get("predictedRate");
            
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("date", date);
            point.put("occupancyRate", rate);
            
            if (rate < LOWER_THRESHOLD.doubleValue()) {
                point.put("suggestion", "DECREASE");
                point.put("suggestionText", "建议降价10%");
            } else if (rate > UPPER_THRESHOLD.doubleValue()) {
                point.put("suggestion", "INCREASE");
                point.put("suggestionText", "建议涨价5%");
            } else {
                point.put("suggestion", "HOLD");
                point.put("suggestionText", "保持原价");
            }
            
            trendData.add(point);
        }
        
        result.put("roomType", roomType);
        result.put("roomTypeName", prediction.get("roomTypeName"));
        result.put("averagePredictedRate", prediction.get("averagePredictedRate"));
        result.put("trend", prediction.get("trend"));
        result.put("trendData", trendData);
        
        return result;
    }
    
    private String getRoomTypeName(String roomType) {
        return switch (roomType) {
            case "SMALL_DOG_ROOM" -> "小型犬房";
            case "MEDIUM_DOG_ROOM" -> "中型犬房";
            case "LARGE_DOG_ROOM" -> "大型犬房";
            case "CAT_CAVE" -> "猫咪城堡";
            case "CAT_LOFT" -> "猫咪阁楼";
            case "DELUXE_CAT_ROOM" -> "豪华猫房";
            case "SMALL_PET_SUITE" -> "小型宠物套房";
            default -> roomType;
        };
    }
    
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class PriceSuggestionResult {
        private Long roomId;
        private String roomType;
        private String roomTypeName;
        private String roomName;
        private BigDecimal originalPrice;
        private BigDecimal adjustedPrice;
        private String adjustmentType;
        private BigDecimal adjustmentPercentage;
        private BigDecimal occupancyRate;
        private String reason;
        private LocalDate startDate;
        private LocalDate endDate;
        private String ruleName;
    }
}
