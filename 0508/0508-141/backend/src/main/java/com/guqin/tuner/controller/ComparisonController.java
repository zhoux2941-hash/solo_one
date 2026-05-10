package com.guqin.tuner.controller;

import com.guqin.tuner.service.ComparisonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/comparison")
@CrossOrigin(origins = "*")
public class ComparisonController {

    @Autowired
    private ComparisonService comparisonService;

    @PostMapping("/compare")
    public ResponseEntity<Map<String, Object>> compareInstruments(@RequestBody Map<String, Object> request) {
        List<Long> guqinIds = (List<Long>) request.get("guqinIds");
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> results = comparisonService.compareInstruments(guqinIds);
            response.put("success", true);
            response.put("data", results);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "对比失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/history/{guqinId}")
    public ResponseEntity<Map<String, Object>> getHistory(@PathVariable Long guqinId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            List<Map<String, Object>> history = comparisonService.getHistoryCurve(guqinId);
            response.put("success", true);
            response.put("data", history);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取历史失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/statistics/{guqinId}")
    public ResponseEntity<Map<String, Object>> getStatistics(@PathVariable Long guqinId) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            Map<String, Object> statistics = comparisonService.getStatistics(guqinId);
            if (statistics != null) {
                response.put("success", true);
                response.put("data", statistics);
            } else {
                response.put("success", false);
                response.put("message", "暂无统计数据");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "获取统计失败: " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
}
