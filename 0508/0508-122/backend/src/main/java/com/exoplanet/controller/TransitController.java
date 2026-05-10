package com.exoplanet.controller;

import com.exoplanet.dto.TransitRequest;
import com.exoplanet.dto.TransitResponse;
import com.exoplanet.service.TransitService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/transit")
@RequiredArgsConstructor
public class TransitController {

    private final TransitService transitService;

    @PostMapping("/simulate")
    public ResponseEntity<TransitResponse> simulateTransit(@Validated @RequestBody TransitRequest request) {
        log.info("Received transit simulation request: starRadius={}, planetRadius={}, period={}, inclination={}",
                request.getStarRadius(), request.getPlanetRadius(), request.getOrbitalPeriod(), request.getInclination());

        TransitResponse response = transitService.simulateTransit(request);

        log.info("Simulation completed: transitDepth={}, transitDuration={}, starType={}",
                response.getTransitDepth(), response.getTransitDuration(), response.getStarType());

        return ResponseEntity.ok(response);
    }
}