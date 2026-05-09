package com.restaurant.queue.controller;

import com.restaurant.queue.service.CorrelationAnalysisService;
import com.restaurant.queue.service.MockDataGenerator;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/correlation")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class CorrelationController {

    private final CorrelationAnalysisService correlationAnalysisService;
    private final MockDataGenerator mockDataGenerator;

    @GetMapping("/wait-vs-order")
    public ResponseEntity<Map<String, Object>> getWaitTimeVsOrder(
            @RequestParam(defaultValue = "30") int days,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(correlationAnalysisService.getWaitTimeVsOrderAnalysis(effectiveRestaurantId, days));
    }

    @GetMapping("/wait-groups")
    public ResponseEntity<Map<String, Object>> getWaitTimeGroups(
            @RequestParam(defaultValue = "30") int days,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(correlationAnalysisService.getWaitTimeGroupStatistics(effectiveRestaurantId, days));
    }

    @GetMapping("/high-price")
    public ResponseEntity<Map<String, Object>> getHighPriceAnalysis(
            @RequestParam(defaultValue = "30") int days,
            @RequestParam(defaultValue = "30") int threshold,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(correlationAnalysisService.getHighPriceDishAnalysis(
                effectiveRestaurantId, days, threshold));
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(
            @RequestParam(defaultValue = "30") int days,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(correlationAnalysisService.getOverview(effectiveRestaurantId, days));
    }

    @PostMapping("/mock/generate")
    public ResponseEntity<Map<String, String>> generateMockData(
            @RequestParam(defaultValue = "200") int count,
            @RequestParam(defaultValue = "true") boolean positiveCorrelation,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        String message = mockDataGenerator.generateCorrelationData(effectiveRestaurantId, count, positiveCorrelation);
        return ResponseEntity.ok(Map.of("message", message));
    }
}
