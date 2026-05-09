package com.company.docsearch.controller;

import com.company.docsearch.service.AnalyticsService;
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

    @GetMapping("/volume-trend")
    public ResponseEntity<Map<String, Object>> getSearchVolumeTrend(
            @RequestParam(defaultValue = "24") int hours) {
        Map<String, Object> result = analyticsService.getSearchVolumeTrend(hours);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/noresult-rate")
    public ResponseEntity<Map<String, Object>> getNoResultRateTrend(
            @RequestParam(defaultValue = "7") int days) {
        Map<String, Object> result = analyticsService.getNoResultRateTrend(days);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/click-heatmap")
    public ResponseEntity<List<Map<String, Object>>> getClickHeatmap() {
        List<Map<String, Object>> result = analyticsService.getClickHeatmap();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/wordcloud")
    public ResponseEntity<Map<String, Object>> getWordCloudData(
            @RequestParam(defaultValue = "50") int limit) {
        Map<String, Object> result = analyticsService.getWordCloudData(limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/doc-ranking")
    public ResponseEntity<Map<String, Object>> getDocumentClickRanking(
            @RequestParam(defaultValue = "10") int limit) {
        Map<String, Object> result = analyticsService.getDocumentClickRanking(limit);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary() {
        Map<String, Object> result = analyticsService.getDashboardSummary();
        return ResponseEntity.ok(result);
    }
}
