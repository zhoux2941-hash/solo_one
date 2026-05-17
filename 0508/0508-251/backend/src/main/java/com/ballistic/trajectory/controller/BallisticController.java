package com.ballistic.trajectory.controller;

import com.ballistic.trajectory.dto.BallisticCalculationRequest;
import com.ballistic.trajectory.dto.CalculationResult;
import com.ballistic.trajectory.dto.SlopeCalculationRequest;
import com.ballistic.trajectory.service.BallisticCalculationService;
import com.ballistic.trajectory.service.DataService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*", maxAge = 3600)
public class BallisticController {

    @Autowired
    private BallisticCalculationService calculationService;

    @Autowired
    private DataService dataService;

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = Map.of(
            "status", "UP",
            "service", "山地复杂地形弹道补偿计算平台",
            "timestamp", LocalDateTime.now().toString(),
            "version", "1.0.0"
        );
        return ResponseEntity.ok(response);
    }

    @PostMapping("/calculate/slope")
    public ResponseEntity<CalculationResult> calculateSlope(@RequestBody SlopeCalculationRequest request) {
        CalculationResult result = calculationService.calculateSlope(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/calculate/ballistic")
    public ResponseEntity<CalculationResult> calculateBallistic(@RequestBody BallisticCalculationRequest request) {
        CalculationResult result = calculationService.calculateBallistic(request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/calculate/wind")
    public ResponseEntity<CalculationResult> calculateWindCorrection(@RequestBody Map<String, Object> request) {
        CalculationResult result = calculationService.calculateWindCorrection(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records")
    public ResponseEntity<CalculationResult> getAllRecords() {
        CalculationResult result = dataService.getAllRecords();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records/type/{type}")
    public ResponseEntity<CalculationResult> getRecordsByType(@PathVariable String type) {
        CalculationResult result = dataService.getRecordsByType(type);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records/{id}")
    public ResponseEntity<CalculationResult> getRecordById(@PathVariable Long id) {
        CalculationResult result = dataService.getRecordById(id);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/records/{id}")
    public ResponseEntity<CalculationResult> deleteRecord(@PathVariable Long id) {
        CalculationResult result = dataService.deleteRecord(id);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records/paged")
    public ResponseEntity<CalculationResult> getRecordsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CalculationResult result = dataService.getRecordsPaged(page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/statistics")
    public ResponseEntity<CalculationResult> getStatistics() {
        CalculationResult result = dataService.getStatistics();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/calculate/penetration")
    public ResponseEntity<CalculationResult> calculatePenetration(@RequestBody Map<String, Object> request) {
        CalculationResult result = calculationService.calculatePenetration(request);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records/date-range")
    public ResponseEntity<CalculationResult> getRecordsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        CalculationResult result = dataService.getRecordsByDateRange(start, end);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/records/distance-range")
    public ResponseEntity<CalculationResult> getRecordsByDistanceRange(
            @RequestParam Double minDistance,
            @RequestParam Double maxDistance) {
        CalculationResult result = dataService.getRecordsByDistanceRange(minDistance, maxDistance);
        return ResponseEntity.ok(result);
    }
}
