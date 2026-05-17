package com.military.training.controller;

import com.military.training.entity.ComprehensiveScore;
import com.military.training.service.ComprehensiveScoreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comprehensive")
public class ComprehensiveScoreController {

    @Autowired
    private ComprehensiveScoreService service;

    @GetMapping("/ranking")
    public List<ComprehensiveScore> getRanking() {
        return service.findAllRanked();
    }

    @GetMapping("/trainee/{traineeId}")
    public ResponseEntity<ComprehensiveScore> findByTraineeId(@PathVariable Long traineeId) {
        return service.findByTraineeId(traineeId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateAll() {
        Map<String, Object> result = service.calculateAllScores();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/weakness/{traineeId}")
    public ResponseEntity<Map<String, Object>> getWeaknessAnalysis(@PathVariable Long traineeId) {
        return ResponseEntity.ok(service.getWeaknessAnalysis(traineeId));
    }
}