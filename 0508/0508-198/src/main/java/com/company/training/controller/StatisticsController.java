package com.company.training.controller;

import com.company.training.dto.CourseStatisticsDTO;
import com.company.training.service.StatisticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/statistics")
@CrossOrigin(origins = "*")
public class StatisticsController {

    @Autowired
    private StatisticsService statisticsService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllCourseStatistics() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<CourseStatisticsDTO> statistics = statisticsService.getAllCourseStatistics();
            response.put("success", true);
            response.put("data", statistics);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<Map<String, Object>> getCourseStatistics(@PathVariable Long courseId) {
        Map<String, Object> response = new HashMap<>();
        try {
            CourseStatisticsDTO statistics = statisticsService.getCourseStatistics(courseId);
            response.put("success", true);
            response.put("data", statistics);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
