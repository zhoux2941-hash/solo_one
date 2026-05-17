package com.prison.call.controller;

import com.prison.call.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
    
    @Autowired
    private ReportService reportService;
    
    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboardStats() {
        return ResponseEntity.ok(reportService.getDashboardStats());
    }
    
    @GetMapping("/prison-area-calls")
    public ResponseEntity<Map<String, Object>> getPrisonAreaCallStats() {
        return ResponseEntity.ok(reportService.getPrisonAreaCallStats());
    }
    
    @GetMapping("/call-trend")
    public ResponseEntity<Map<String, Object>> getCallTrendStats(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(reportService.getCallTrendStats(days));
    }
    
    @GetMapping("/alert-trend")
    public ResponseEntity<Map<String, Object>> getAlertTrendStats(@RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(reportService.getAlertTrendStats(days));
    }
}
