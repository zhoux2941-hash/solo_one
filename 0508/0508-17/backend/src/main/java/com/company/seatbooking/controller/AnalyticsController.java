package com.company.seatbooking.controller;

import com.company.seatbooking.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "http://localhost:3000")
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }
    
    @GetMapping("/usage")
    public ResponseEntity<Map<String, Object>> getAreaUsageRate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        
        if (startDate == null) {
            startDate = LocalDate.now().minusDays(7);
        }
        if (endDate == null) {
            endDate = LocalDate.now();
        }
        
        return ResponseEntity.ok(analyticsService.getAreaUsageRate(startDate, endDate));
    }
    
    @GetMapping("/top-seats")
    public ResponseEntity<List<Map<String, Object>>> getTopSeats(
            @RequestParam(defaultValue = "5") int limit) {
        return ResponseEntity.ok(analyticsService.getTopSeats(limit));
    }
    
    @GetMapping("/predict-available")
    public ResponseEntity<Map<String, Object>> predictAvailableSlots() {
        return ResponseEntity.ok(analyticsService.predictAvailableSlots());
    }
}
