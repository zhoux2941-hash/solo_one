package com.pest.controller;

import com.pest.service.ReportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {

    @Autowired
    private ReportService reportService;

    @GetMapping("/crop-type")
    public ResponseEntity<?> getCropTypeStats() {
        List<Object[]> stats = reportService.getCropTypeStats();
        List<Map<String, Object>> data = new ArrayList<>();
        for (Object[] row : stats) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("value", row[1]);
            data.add(item);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pest-name")
    public ResponseEntity<?> getPestNameStats() {
        List<Object[]> stats = reportService.getPestNameStats();
        List<Map<String, Object>> data = new ArrayList<>();
        for (Object[] row : stats) {
            Map<String, Object> item = new HashMap<>();
            item.put("name", row[0]);
            item.put("value", row[1]);
            data.add(item);
        }
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", data);
        return ResponseEntity.ok(result);
    }
}