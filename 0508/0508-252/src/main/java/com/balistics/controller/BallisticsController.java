package com.balistics.controller;

import com.balistics.entity.BallisticsLog;
import com.balistics.entity.BallisticsResult;
import com.balistics.entity.WeatherData;
import com.balistics.service.BallisticsDragService;
import com.balistics.service.BallisticsLogService;
import com.balistics.service.SeasonComparisonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ballistics")
@CrossOrigin(origins = "*")
public class BallisticsController {
    
    @Autowired
    private BallisticsDragService ballisticsDragService;
    
    @Autowired
    private SeasonComparisonService seasonComparisonService;
    
    @Autowired
    private BallisticsLogService ballisticsLogService;
    
    @PostMapping("/calculate")
    public ResponseEntity<?> calculateBallistics(@RequestBody WeatherData weatherData) {
        try {
            BallisticsResult result = ballisticsDragService.calculateBallistics(weatherData);
            BallisticsLog log = ballisticsLogService.createCalculationLog(result);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("result", result);
            response.put("logId", log.getId());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "计算失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/standard")
    public ResponseEntity<?> getStandardCondition() {
        try {
            BallisticsResult result = ballisticsDragService.calculateStandardConditionBallistics();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("result", result);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取标准条件失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/seasons/compare")
    public ResponseEntity<?> compareSeasons() {
        try {
            Map<String, BallisticsResult> results = seasonComparisonService.compareFourSeasons();
            String report = seasonComparisonService.generateComparisonReport(results);
            ballisticsLogService.createComparisonLog(report);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("results", results);
            response.put("report", report);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "季节对比失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/extreme/compare")
    public ResponseEntity<?> compareExtremeConditions() {
        try {
            Map<String, BallisticsResult> results = seasonComparisonService.compareExtremeConditions();
            String report = seasonComparisonService.generateComparisonReport(results);
            ballisticsLogService.createComparisonLog(report);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("results", results);
            response.put("report", report);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "极端气候对比失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/logs")
    public ResponseEntity<?> getLogs(@RequestParam(defaultValue = "10") int limit) {
        try {
            List<BallisticsLog> logs;
            if (limit > 0) {
                logs = ballisticsLogService.getRecentLogs(limit);
            } else {
                logs = ballisticsLogService.getAllLogs();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("logs", logs);
            response.put("total", ballisticsLogService.getAllLogs().size());
            response.put("displayed", logs.size());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取日志失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @GetMapping("/logs/{id}")
    public ResponseEntity<?> getLogById(@PathVariable Long id) {
        try {
            BallisticsLog log = ballisticsLogService.getLogById(id);
            
            if (log == null) {
                Map<String, Object> response = new HashMap<>();
                response.put("success", false);
                response.put("message", "日志不存在");
                return ResponseEntity.notFound().build();
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("log", log);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "获取日志失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @DeleteMapping("/logs/{id}")
    public ResponseEntity<?> deleteLog(@PathVariable Long id) {
        try {
            ballisticsLogService.deleteLog(id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "日志删除成功");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "删除日志失败: " + e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
