package com.blindpath.monitor.controller;

import com.blindpath.monitor.dto.WearPredictionDTO;
import com.blindpath.monitor.service.WearPredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wear")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173", "http://127.0.0.1:5173"})
public class WearPredictionController {

    private final WearPredictionService wearPredictionService;

    @GetMapping("/predict")
    public ResponseEntity<WearPredictionDTO> getWearPrediction() {
        WearPredictionDTO prediction = wearPredictionService.predictWearTrend();
        return ResponseEntity.ok(prediction);
    }
}
