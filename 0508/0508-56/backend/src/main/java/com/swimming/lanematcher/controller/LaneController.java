package com.swimming.lanematcher.controller;

import com.swimming.lanematcher.config.LaneConfig;
import com.swimming.lanematcher.dto.FeedbackRequest;
import com.swimming.lanematcher.dto.RecommendationRequest;
import com.swimming.lanematcher.dto.RecommendationResponse;
import com.swimming.lanematcher.service.RecommendationService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class LaneController {

    private final RecommendationService recommendationService;

    public LaneController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    @GetMapping("/lanes")
    public ResponseEntity<Map<String, Object>> getLanes() {
        List<LaneConfig.LaneSetting> lanes = recommendationService.getAllLanes();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", lanes);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/recommend")
    public ResponseEntity<RecommendationResponse> recommend(@Valid @RequestBody RecommendationRequest request) {
        RecommendationResponse response = recommendationService.recommendLane(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/feedback")
    public ResponseEntity<Map<String, Object>> feedback(@Valid @RequestBody FeedbackRequest request) {
        Map<String, Object> result = recommendationService.submitFeedback(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getHistory() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", recommendationService.getRecentHistory());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/feedback-stats")
    public ResponseEntity<Map<String, Object>> getFeedbackStats() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", recommendationService.getRecentFeedback());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", recommendationService.getAnalytics());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/lane-weights")
    public ResponseEntity<Map<String, Object>> getLaneWeights() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", recommendationService.getLaneWeightStats());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/lane-status")
    public ResponseEntity<Map<String, Object>> getLaneStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", recommendationService.getRealtimeLaneStatus());
        return ResponseEntity.ok(response);
    }
}