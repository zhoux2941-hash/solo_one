package com.pool.controller;

import com.pool.dto.DailyAverageDTO;
import com.pool.dto.LaneToleranceDTO;
import com.pool.service.LaneToleranceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/lanes")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class LaneToleranceController {

    @Autowired
    private LaneToleranceService laneToleranceService;

    @GetMapping
    public ResponseEntity<List<LaneToleranceDTO>> getAllLanes() {
        List<LaneToleranceDTO> lanes = laneToleranceService.getAllLanes();
        return ResponseEntity.ok(lanes);
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<LaneToleranceDTO>> getLanesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<LaneToleranceDTO> lanes = laneToleranceService.getLanesByDate(date);
        return ResponseEntity.ok(lanes);
    }

    @GetMapping("/zone/{zone}")
    public ResponseEntity<List<LaneToleranceDTO>> getLanesByZone(@PathVariable String zone) {
        List<LaneToleranceDTO> lanes = laneToleranceService.getLanesByZone(zone);
        return ResponseEntity.ok(lanes);
    }

    @GetMapping("/daily-averages")
    public ResponseEntity<List<DailyAverageDTO>> getDailyAverages(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<DailyAverageDTO> averages = laneToleranceService.getDailyAverages(startDate, endDate);
        return ResponseEntity.ok(averages);
    }
}
