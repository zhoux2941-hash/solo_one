package com.company.watermonitor.controller;

import com.company.watermonitor.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/consumption-rates")
    public ResponseEntity<List<Map<String, Object>>> getConsumptionRates() {
        return ResponseEntity.ok(analyticsService.getConsumptionRates());
    }

    @GetMapping("/machine/{machineId}/history")
    public ResponseEntity<List<Map<String, Object>>> getMachineHistory(
            @PathVariable Long machineId,
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(analyticsService.getMachineConsumptionHistory(machineId, hours));
    }

    @GetMapping("/machine/{machineId}/rate-trend")
    public ResponseEntity<Map<String, Object>> getRateTrend(
            @PathVariable Long machineId,
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(analyticsService.getConsumptionRateTrend(machineId, hours));
    }
}
