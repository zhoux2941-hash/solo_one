package com.logistics.track.controller;

import com.logistics.track.dto.DailyTimeAnalysisDTO;
import com.logistics.track.dto.RouteTimeAnalysisDTO;
import com.logistics.track.dto.StuckCenterDTO;
import com.logistics.track.service.StatisticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@RequiredArgsConstructor
public class StatisticsController {

    private final StatisticsService statisticsService;

    @GetMapping("/daily-time")
    public ResponseEntity<List<DailyTimeAnalysisDTO>> getDailyTimeAnalysis(
            @RequestParam(defaultValue = "7") int days) {
        return ResponseEntity.ok(statisticsService.getDailyTimeAnalysis(days));
    }

    @GetMapping("/route-time")
    public ResponseEntity<List<RouteTimeAnalysisDTO>> getRouteTimeAnalysis() {
        return ResponseEntity.ok(statisticsService.getRouteTimeAnalysis());
    }

    @GetMapping("/stuck-centers")
    public ResponseEntity<List<StuckCenterDTO>> getStuckCenters() {
        return ResponseEntity.ok(statisticsService.getStuckCenters());
    }

    @GetMapping("/stuck-centers/refresh")
    public ResponseEntity<List<StuckCenterDTO>> refreshStuckCenters() {
        return ResponseEntity.ok(statisticsService.calculateAndCacheStuckCenters());
    }

    @GetMapping("/sankey")
    public ResponseEntity<Map<String, Object>> getSankeyData() {
        return ResponseEntity.ok(statisticsService.getSankeyData());
    }
}
