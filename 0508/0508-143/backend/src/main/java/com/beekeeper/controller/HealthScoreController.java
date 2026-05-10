package com.beekeeper.controller;

import com.beekeeper.dto.HealthScoreDTO;
import com.beekeeper.service.HealthScoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/health")
@RequiredArgsConstructor
public class HealthScoreController {
    
    private final HealthScoreService healthScoreService;
    
    @GetMapping
    public ResponseEntity<List<HealthScoreDTO>> getAllHealthScores() {
        return ResponseEntity.ok(healthScoreService.calculateAllHealthScores());
    }
    
    @GetMapping("/{beehiveId}")
    public ResponseEntity<HealthScoreDTO> getHealthScore(@PathVariable Long beehiveId) {
        return ResponseEntity.ok(healthScoreService.calculateHealthScore(beehiveId));
    }
}
