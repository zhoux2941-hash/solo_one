package com.bikesharing.platform.controller;

import com.bikesharing.platform.dto.PredictionDTO;
import com.bikesharing.platform.service.PredictionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/prediction")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @GetMapping("/next-2h")
    public ResponseEntity<List<PredictionDTO>> getNext2HoursPredictions() {
        List<PredictionDTO> predictions = predictionService.getNext2HoursPredictions();
        return ResponseEntity.ok(predictions);
    }

    @GetMapping("/refresh")
    public ResponseEntity<String> refreshPredictions() {
        predictionService.refreshPredictions();
        return ResponseEntity.ok("Predictions refreshed successfully");
    }
}
