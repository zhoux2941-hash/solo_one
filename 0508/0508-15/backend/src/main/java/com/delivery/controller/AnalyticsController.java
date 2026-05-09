package com.delivery.controller;

import com.delivery.dto.DeliveryTimeStatsDTO;
import com.delivery.dto.OnTimeRateDTO;
import com.delivery.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/on-time-rate")
    public ResponseEntity<Map<String, List<OnTimeRateDTO>>> getOnTimeRates(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(analyticsService.getRiderOnTimeRates(days));
    }

    @GetMapping("/delivery-time-boxplot")
    public ResponseEntity<List<DeliveryTimeStatsDTO>> getDeliveryTimeBoxPlot(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(analyticsService.getDeliveryTimeBoxPlot(days));
    }
}
