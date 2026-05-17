package com.metro.controller;

import com.metro.entity.VentilationRecord;
import com.metro.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/dust-trend")
    public ResponseEntity<Map<String, Object>> getDustConcentrationTrend(
            @RequestParam(required = false) String sectionId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(reportService.getDustConcentrationTrend(sectionId, startTime, endTime));
    }

    @GetMapping("/ventilation-duration")
    public ResponseEntity<Map<String, Object>> getVentilationDurationReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        return ResponseEntity.ok(reportService.getVentilationDurationReport(startTime, endTime));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardData() {
        return ResponseEntity.ok(reportService.getDashboardData());
    }

    @GetMapping("/ventilation-records")
    public ResponseEntity<List<VentilationRecord>> getVentilationRecords(
            @RequestParam(required = false) String sectionId) {
        return ResponseEntity.ok(reportService.getVentilationRecords(sectionId));
    }
}
