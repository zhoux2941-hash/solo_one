package com.exoplanet.controller;

import com.exoplanet.dto.PredictionRequest;
import com.exoplanet.dto.PredictionResponse;
import com.exoplanet.service.PredictionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/prediction")
@RequiredArgsConstructor
public class PredictionController {

    private final PredictionService predictionService;

    @PostMapping("/transit")
    public ResponseEntity<PredictionResponse> predictTransit(@Validated @RequestBody PredictionRequest request) {
        log.info("Received transit prediction request: starMass={}, planetDistance={}, inclination={}",
                request.getStarMass(), request.getPlanetDistance(), request.getInclination());

        PredictionResponse response = predictionService.predictTransit(request);

        log.info("Prediction completed: orbitalPeriod={}, transitDuration={}, nextTransit={}",
                response.getOrbitalPeriodDescription(),
                response.getTransitDurationDescription(),
                response.getNextTransitTimeDescription());

        return ResponseEntity.ok(response);
    }
}