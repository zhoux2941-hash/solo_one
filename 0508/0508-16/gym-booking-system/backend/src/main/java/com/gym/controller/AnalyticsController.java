package com.gym.controller;

import com.gym.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*")
public class AnalyticsController {
    
    @Autowired
    private AnalyticsService analyticsService;
    
    @GetMapping("/coaches")
    public List<Map<String, Object>> getAllCoaches() {
        return analyticsService.getAllCoaches();
    }
    
    @GetMapping("/coach/{coachId}/checkin-rate")
    public Map<String, Object> getCoachCheckinRateOverTime(
            @PathVariable Long coachId,
            @RequestParam(defaultValue = "30") int days) {
        return analyticsService.getCoachCheckinRateOverTime(coachId, days);
    }
    
    @GetMapping("/checkin-heatmap")
    public List<Map<String, Object>> getCheckinHeatmap(
            @RequestParam(defaultValue = "4") int weeks) {
        return analyticsService.getCheckinHeatmap(weeks);
    }
    
    @GetMapping("/top-no-show-courses")
    public List<Map<String, Object>> getTopNoShowCourses(
            @RequestParam(defaultValue = "5") int limit) {
        return analyticsService.getTopNoShowCourses(limit);
    }
}
