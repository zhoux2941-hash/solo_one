package com.logistics.track.controller;

import com.logistics.track.dto.AnomalyDetectionResultDTO;
import com.logistics.track.dto.AnomalyPackageDTO;
import com.logistics.track.dto.RouteStatisticsDTO;
import com.logistics.track.service.AnomalyDetectionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/anomaly")
@RequiredArgsConstructor
public class AnomalyController {

    private final AnomalyDetectionService anomalyDetectionService;

    @GetMapping("/list")
    public ResponseEntity<List<AnomalyPackageDTO>> getAnomalyList() {
        return ResponseEntity.ok(anomalyDetectionService.getAnomalyList());
    }

    @GetMapping("/route-stats")
    public ResponseEntity<List<RouteStatisticsDTO>> getRouteStatistics() {
        return ResponseEntity.ok(anomalyDetectionService.getRouteStatistics());
    }

    @GetMapping("/detect")
    public ResponseEntity<AnomalyDetectionResultDTO> detectAnomalies() {
        return ResponseEntity.ok(anomalyDetectionService.detectAnomalies());
    }

    @PostMapping("/force-detect")
    public ResponseEntity<AnomalyDetectionResultDTO> forceDetect() {
        return ResponseEntity.ok(anomalyDetectionService.forceDetect());
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getAnomalyCount() {
        return ResponseEntity.ok(anomalyDetectionService.getAnomalyList().size());
    }
}
