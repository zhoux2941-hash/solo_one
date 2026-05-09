package com.restaurant.queue.controller;

import com.restaurant.queue.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/traffic")
    public ResponseEntity<Map<String, Object>> getTrafficHeatmap(
            @RequestParam(defaultValue = "7") int days,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(analyticsService.getTrafficHeatmap(days, effectiveRestaurantId));
    }

    @GetMapping("/turnover")
    public ResponseEntity<Map<String, Object>> getTurnoverRate(
            @RequestParam(defaultValue = "24") int hours,
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(analyticsService.getTurnoverRateStatistics(hours, effectiveRestaurantId));
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(
            @RequestHeader(value = "X-Restaurant-Id", required = false) Long restaurantId,
            @RequestParam(value = "restaurantId", required = false) Long queryRestaurantId) {
        Long effectiveRestaurantId = queryRestaurantId != null ? queryRestaurantId : restaurantId;
        return ResponseEntity.ok(analyticsService.getOverviewStatistics(effectiveRestaurantId));
    }
}
