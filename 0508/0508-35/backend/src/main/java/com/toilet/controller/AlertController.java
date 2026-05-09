package com.toilet.controller;

import com.toilet.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {

    @Autowired
    private AlertService alertService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAlerts() {
        List<Map<String, Object>> alerts = alertService.getAlerts();
        
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("code", 200);
        response.put("message", "success");
        response.put("data", alerts);
        response.put("count", alerts.size());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refill/{stallId}")
    public ResponseEntity<Map<String, Object>> refillPaper(@PathVariable Long stallId) {
        boolean success = alertService.refillPaper(stallId);
        
        Map<String, Object> response = new LinkedHashMap<>();
        if (success) {
            response.put("code", 200);
            response.put("message", "success");
            response.put("data", "厕纸已补充，余量重置为100%");
        } else {
            response.put("code", 404);
            response.put("message", "error");
            response.put("data", "未找到该厕位");
        }
        
        return ResponseEntity.ok(response);
    }
}
