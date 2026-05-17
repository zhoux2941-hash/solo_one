package com.zoo.monitoring.controller;

import com.zoo.monitoring.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {
    @Autowired
    private ReportService reportService;

    @GetMapping("/vaccination-rate")
    public List<Map<String, Object>> getVaccinationRateReport() {
        return reportService.getVaccinationRateReport();
    }

    @GetMapping("/alert-statistics")
    public Map<String, Object> getAlertStatistics(@RequestParam(defaultValue = "30") int days) {
        return reportService.getAlertStatistics(days);
    }
}
