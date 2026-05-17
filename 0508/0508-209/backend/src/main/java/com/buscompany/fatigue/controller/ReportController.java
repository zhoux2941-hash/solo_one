package com.buscompany.fatigue.controller;

import com.buscompany.fatigue.entity.Alert;
import com.buscompany.fatigue.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
    @Autowired
    private ReportService reportService;

    @GetMapping("/ranking")
    public ResponseEntity<List<Map<String, Object>>> getDriverRanking(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDateTime startTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime endTime = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        return ResponseEntity.ok(reportService.getDriverAlertRanking(startTime, endTime));
    }

    @GetMapping("/by-hour")
    public ResponseEntity<Map<Integer, Integer>> getAlertByHour(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        LocalDateTime startTime = startDate != null ? startDate.atStartOfDay() : LocalDate.now().minusDays(7).atStartOfDay();
        LocalDateTime endTime = endDate != null ? endDate.atTime(LocalTime.MAX) : LocalDate.now().atTime(LocalTime.MAX);

        return ResponseEntity.ok(reportService.getAlertByHour(startTime, endTime));
    }

    @GetMapping("/recent-alerts")
    public ResponseEntity<List<Alert>> getRecentAlerts(@RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(reportService.getRecentAlerts(limit));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(reportService.getDashboardStats());
    }
}
