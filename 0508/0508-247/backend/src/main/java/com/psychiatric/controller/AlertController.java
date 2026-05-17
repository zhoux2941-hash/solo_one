package com.psychiatric.controller;

import com.psychiatric.entity.Alert;
import com.psychiatric.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {
    
    @Autowired
    private AlertService alertService;
    
    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }
    
    @GetMapping("/unread")
    public List<Alert> getUnreadAlerts() {
        return alertService.getUnreadAlerts();
    }
    
    @PostMapping("/{id}/read")
    public ResponseEntity<Alert> markAsRead(@PathVariable Long id) {
        Alert alert = alertService.markAsRead(id);
        return alert != null ? ResponseEntity.ok(alert) : ResponseEntity.notFound().build();
    }
    
    @PostMapping("/analyze")
    public String triggerAnalysis() {
        alertService.triggerAnalysis();
        return "分析已触发";
    }
}
