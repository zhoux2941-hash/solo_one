package com.pumpstation.controller;

import com.pumpstation.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
    
    @Autowired
    private ReportService reportService;
    
    @GetMapping("/pump/{pumpNo}/monthly")
    public ResponseEntity<Map<String, Object>> getMonthlyReport(
            @PathVariable String pumpNo,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(reportService.getMonthlyReport(pumpNo, year, month));
    }
    
    @GetMapping("/pump/{pumpNo}/efficiency-trend")
    public ResponseEntity<List<Map<String, Object>>> getEfficiencyTrend(
            @PathVariable String pumpNo,
            @RequestParam(defaultValue = "6") int months) {
        return ResponseEntity.ok(reportService.getEfficiencyTrend(pumpNo, months));
    }
    
    @GetMapping("/all/monthly")
    public ResponseEntity<Map<String, Object>> getAllPumpsMonthlyReport(
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(reportService.getAllPumpsMonthlyReport(year, month));
    }
}
