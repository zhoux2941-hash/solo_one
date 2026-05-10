package com.company.watermonitor.controller;

import com.company.watermonitor.dto.RestockRecommendationDTO;
import com.company.watermonitor.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/prediction")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @GetMapping("/recommendations")
    public ResponseEntity<List<RestockRecommendationDTO>> getRecommendations() {
        return ResponseEntity.ok(predictionService.getRestockRecommendations());
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary() {
        return ResponseEntity.ok(predictionService.getOverallSummary());
    }
}
