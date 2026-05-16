package com.property.maintenance.controller;

import com.property.maintenance.service.ReportService;
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

    @GetMapping("/average-repair-duration")
    public ResponseEntity<List<Map<String, Object>>> getAverageRepairDuration() {
        return ResponseEntity.ok(reportService.getAverageRepairDuration());
    }

    @GetMapping("/spare-part-consumption-ranking")
    public ResponseEntity<List<Map<String, Object>>> getSparePartConsumptionRanking() {
        return ResponseEntity.ok(reportService.getSparePartConsumptionRanking());
    }
}
