package com.metro.inspection.controller;

import com.metro.inspection.dto.SectionDensityDTO;
import com.metro.inspection.dto.StatisticsDTO;
import com.metro.inspection.dto.TrendDTO;
import com.metro.inspection.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@CrossOrigin(origins = "*")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/statistics")
    public ResponseEntity<StatisticsDTO> getStatistics() {
        return ResponseEntity.ok(reportService.getStatistics());
    }

    @GetMapping("/density")
    public ResponseEntity<List<SectionDensityDTO>> getSectionDensity() {
        return ResponseEntity.ok(reportService.getSectionDensity());
    }

    @GetMapping("/trend")
    public ResponseEntity<TrendDTO> getTrendPrediction() {
        return ResponseEntity.ok(reportService.getTrendPrediction());
    }
}
