package com.beekeeper.controller;

import com.beekeeper.dto.BloomingPredictionDTO;
import com.beekeeper.service.BloomingPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/blooming")
@RequiredArgsConstructor
public class BloomingPredictionController {
    
    private final BloomingPredictionService bloomingPredictionService;
    
    @GetMapping
    public ResponseEntity<List<BloomingPredictionDTO>> getAllPredictions() {
        return ResponseEntity.ok(bloomingPredictionService.predictAllBlooming());
    }
    
    @GetMapping("/{sourceId}")
    public ResponseEntity<BloomingPredictionDTO> getPredictionById(@PathVariable Long sourceId) {
        return ResponseEntity.ok(bloomingPredictionService.predictBloomingById(sourceId));
    }
    
    @PostMapping("/init")
    public ResponseEntity<Void> initializeData() {
        bloomingPredictionService.initializeDefaultNectarSources();
        return ResponseEntity.ok().build();
    }
}
