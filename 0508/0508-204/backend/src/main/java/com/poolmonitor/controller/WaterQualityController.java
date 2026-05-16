package com.poolmonitor.controller;

import com.poolmonitor.entity.WaterQualityData;
import com.poolmonitor.service.WaterQualityService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/water-quality")
@CrossOrigin(origins = "*")
public class WaterQualityController {

    @Autowired
    private WaterQualityService waterQualityService;

    @PostMapping
    public ResponseEntity<WaterQualityData> addData(@RequestBody WaterQualityData data) {
        WaterQualityData savedData = waterQualityService.addWaterQualityData(data);
        return ResponseEntity.ok(savedData);
    }

    @GetMapping
    public ResponseEntity<List<WaterQualityData>> getAllData() {
        return ResponseEntity.ok(waterQualityService.getAllData());
    }

    @GetMapping("/range")
    public ResponseEntity<List<WaterQualityData>> getDataByRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(waterQualityService.getDataByDateRange(startTime, endTime));
    }

    @GetMapping("/report/daily")
    public ResponseEntity<Map<String, Object>> getDailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(waterQualityService.getDailyReport(date));
    }

    @GetMapping("/report/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(waterQualityService.getMonthlyReport(year, month));
    }

    @GetMapping("/trend")
    public ResponseEntity<Map<String, Object>> getTrendData(
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(waterQualityService.getTrendData(hours));
    }
}