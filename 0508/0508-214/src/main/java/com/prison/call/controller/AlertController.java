package com.prison.call.controller;

import com.prison.call.entity.Alert;
import com.prison.call.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {
    
    @Autowired
    private AlertService alertService;
    
    @GetMapping
    public ResponseEntity<List<Alert>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }
    
    @GetMapping("/pending")
    public ResponseEntity<List<Alert>> getPendingAlerts() {
        return ResponseEntity.ok(alertService.getPendingAlerts());
    }
    
    @GetMapping("/prison-area/{prisonArea}")
    public ResponseEntity<List<Alert>> getAlertsByPrisonArea(@PathVariable String prisonArea) {
        return ResponseEntity.ok(alertService.getAlertsByPrisonArea(prisonArea));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable Long id) {
        return alertService.getAlertById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PutMapping("/{id}/handle")
    public ResponseEntity<Alert> handleAlert(@PathVariable Long id, @RequestBody Map<String, String> request) {
        String handler = request.getOrDefault("handler", "");
        return ResponseEntity.ok(alertService.handleAlert(id, handler));
    }
}
