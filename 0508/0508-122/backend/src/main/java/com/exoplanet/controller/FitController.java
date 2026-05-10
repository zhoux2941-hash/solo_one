package com.exoplanet.controller;

import com.exoplanet.dto.FitRequest;
import com.exoplanet.dto.FitResponse;
import com.exoplanet.entity.FitResult;
import com.exoplanet.service.FitService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/fit")
@RequiredArgsConstructor
public class FitController {

    private final FitService fitService;
    private final ObjectMapper objectMapper;

    @PostMapping("/calculate")
    public ResponseEntity<FitResponse> calculateFit(@Validated @RequestBody FitRequest request) {
        log.info("Received fit calculation request");

        FitResponse response = fitService.calculateFit(request);

        log.info("Fit calculation completed: chiSquared={}, matchingDegree={}",
                response.getChiSquared(), response.getMatchingDegree());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/save")
    public ResponseEntity<Map<String, String>> saveFitResult(@Validated @RequestBody FitRequest request) {
        log.info("Received save fit result request");

        FitResponse fitResponse = fitService.calculateFit(request);
        String shareToken = fitService.saveFitResult(
                request,
                fitResponse.getChiSquared(),
                fitResponse.getMatchingDegree(),
                request.getObservedData(),
                fitResponse.getFittedFlux()
        );

        Map<String, String> response = new HashMap<>();
        response.put("shareToken", shareToken);
        response.put("message", "Fit result saved successfully");

        log.info("Fit result saved with token: {}", shareToken);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{shareToken}")
    public ResponseEntity<Map<String, Object>> getFitResult(@PathVariable String shareToken) {
        log.info("Received request for fit result with token: {}", shareToken);

        FitResult fitResult = fitService.getFitResult(shareToken);

        try {
            List<Double> originalData = objectMapper.readValue(fitResult.getOriginalData(),
                    new TypeReference<List<Double>>() {});
            List<Double> fitData = objectMapper.readValue(fitResult.getFitData(),
                    new TypeReference<List<Double>>() {});

            Map<String, Object> response = new HashMap<>();
            response.put("shareToken", fitResult.getShareToken());
            response.put("starRadius", fitResult.getStarRadius());
            response.put("starTemperature", fitResult.getStarTemperature());
            response.put("planetRadius", fitResult.getPlanetRadius());
            response.put("orbitalPeriod", fitResult.getOrbitalPeriod());
            response.put("inclination", fitResult.getInclination());
            response.put("fittedPlanetRadius", fitResult.getFittedPlanetRadius());
            response.put("fittedInclination", fitResult.getFittedInclination());
            response.put("chiSquared", fitResult.getChiSquared());
            response.put("matchingDegree", fitResult.getMatchingDegree());
            response.put("noiseLevel", fitResult.getNoiseLevel());
            response.put("originalData", originalData);
            response.put("fitData", fitData);
            response.put("createdAt", fitResult.getCreatedAt());

            return ResponseEntity.ok(response);
        } catch (JsonProcessingException e) {
            log.error("Error deserializing fit data", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}