package com.petboarding.controller;

import com.petboarding.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {
    
    private final AnalyticsService analyticsService;
    
    @GetMapping("/occupancy-heatmap")
    public ResponseEntity<Map<String, Object>> getOccupancyHeatmap(
            @RequestParam(required = false) Integer year) {
        int targetYear = year != null ? year : LocalDate.now().getYear();
        return ResponseEntity.ok(analyticsService.getOccupancyHeatmap(targetYear));
    }
    
    @GetMapping("/pet-type-preference")
    public ResponseEntity<Map<String, Object>> getPetTypePreference() {
        return ResponseEntity.ok(analyticsService.getPetTypePreference());
    }
    
    @GetMapping("/conflict-analysis")
    public ResponseEntity<Map<String, Object>> getConflictAnalysis(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        LocalDate now = LocalDate.now();
        int targetYear = year != null ? year : now.getYear();
        int targetMonth = month != null ? month : now.getMonthValue();
        return ResponseEntity.ok(analyticsService.getConflictAnalysis(targetYear, targetMonth));
    }
}
