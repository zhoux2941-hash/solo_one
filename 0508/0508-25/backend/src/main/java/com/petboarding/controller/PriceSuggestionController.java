package com.petboarding.controller;

import com.petboarding.entity.PriceAdjustmentLog;
import com.petboarding.entity.PriceAdjustmentRule;
import com.petboarding.service.OccupancyPredictionService;
import com.petboarding.service.PriceSuggestionService;
import com.petboarding.service.PriceSuggestionService.PriceSuggestionResult;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/price")
@RequiredArgsConstructor
public class PriceSuggestionController {
    
    private final PriceSuggestionService priceSuggestionService;
    private final OccupancyPredictionService predictionService;
    
    @GetMapping("/suggestions")
    public ResponseEntity<List<PriceSuggestionResult>> generateSuggestions(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        List<PriceSuggestionResult> suggestions;
        
        if (startDate != null && endDate != null) {
            suggestions = priceSuggestionService.generatePriceSuggestions(startDate, endDate);
        } else {
            suggestions = priceSuggestionService.generatePriceSuggestions();
        }
        
        return ResponseEntity.ok(suggestions);
    }
    
    @GetMapping("/suggestions/history")
    public ResponseEntity<List<PriceAdjustmentLog>> getSuggestionHistory(
            @RequestParam(required = false) String status) {
        
        List<PriceAdjustmentLog> logs;
        
        if (status != null) {
            logs = priceSuggestionService.getSuggestionsByStatus(
                    PriceAdjustmentLog.AdjustmentStatus.valueOf(status.toUpperCase()));
        } else {
            logs = priceSuggestionService.getAllSuggestions();
        }
        
        return ResponseEntity.ok(logs);
    }
    
    @PostMapping("/suggestions/{adjustmentId}/apply")
    public ResponseEntity<Map<String, Object>> applyAdjustment(
            @PathVariable Long adjustmentId,
            @RequestParam(required = false) Long appliedBy) {
        
        PriceAdjustmentLog adjustment = priceSuggestionService.applyAdjustment(
                adjustmentId, appliedBy != null ? appliedBy : 1L);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "价格调整已应用");
        response.put("adjustmentId", adjustment.getAdjustmentId());
        response.put("newPrice", adjustment.getAdjustedPrice());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/suggestions/{adjustmentId}/cancel")
    public ResponseEntity<Map<String, Object>> cancelAdjustment(@PathVariable Long adjustmentId) {
        
        PriceAdjustmentLog adjustment = priceSuggestionService.cancelAdjustment(adjustmentId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "价格建议已取消");
        response.put("adjustmentId", adjustment.getAdjustmentId());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/suggestions/batch-apply")
    public ResponseEntity<Map<String, Object>> batchApplyAdjustments(@RequestBody BatchApplyRequest request) {
        
        int successCount = 0;
        int failCount = 0;
        
        for (Long adjustmentId : request.getAdjustmentIds()) {
            try {
                priceSuggestionService.applyAdjustment(adjustmentId, 1L);
                successCount++;
            } catch (Exception e) {
                failCount++;
            }
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("successCount", successCount);
        response.put("failCount", failCount);
        response.put("message", String.format("成功应用 %d 条，失败 %d 条", successCount, failCount));
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/trend/{roomType}")
    public ResponseEntity<Map<String, Object>> getPriceTrend(
            @PathVariable String roomType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        LocalDate effectiveStart = startDate != null ? startDate : LocalDate.now().plusDays(1);
        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now().plusDays(7);
        
        Map<String, Object> trendData = priceSuggestionService.getPriceTrendData(
                roomType, effectiveStart, effectiveEnd);
        
        return ResponseEntity.ok(trendData);
    }
    
    @GetMapping("/prediction/room/{roomId}")
    public ResponseEntity<Map<String, Object>> getRoomPrediction(
            @PathVariable Long roomId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        LocalDate effectiveStart = startDate != null ? startDate : LocalDate.now().plusDays(1);
        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now().plusDays(7);
        
        Map<String, Object> prediction = predictionService.predictRoomOccupancy(
                roomId, effectiveStart, effectiveEnd);
        
        return ResponseEntity.ok(prediction);
    }
    
    @GetMapping("/prediction/room-type/{roomType}")
    public ResponseEntity<Map<String, Object>> getRoomTypePrediction(
            @PathVariable String roomType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        LocalDate effectiveStart = startDate != null ? startDate : LocalDate.now().plusDays(1);
        LocalDate effectiveEnd = endDate != null ? endDate : LocalDate.now().plusDays(7);
        
        Map<String, Object> prediction = predictionService.predictRoomTypeOccupancy(
                roomType, effectiveStart, effectiveEnd);
        
        return ResponseEntity.ok(prediction);
    }
    
    @lombok.Data
    public static class BatchApplyRequest {
        private List<Long> adjustmentIds;
    }
}
