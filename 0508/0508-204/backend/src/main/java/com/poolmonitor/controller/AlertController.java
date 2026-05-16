package com.poolmonitor.controller;

import com.poolmonitor.entity.AlertRecord;
import com.poolmonitor.service.AlertService;
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
    public ResponseEntity<List<AlertRecord>> getAllAlerts() {
        return ResponseEntity.ok(alertService.getAllAlerts());
    }

    @GetMapping("/unhandled")
    public ResponseEntity<List<AlertRecord>> getUnhandledAlerts() {
        return ResponseEntity.ok(alertService.getUnhandledAlerts());
    }

    @GetMapping("/recent")
    public ResponseEntity<List<AlertRecord>> getRecentAlerts() {
        return ResponseEntity.ok(alertService.getRecentAlerts());
    }

    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getAlertStatistics() {
        return ResponseEntity.ok(alertService.getAlertStatistics());
    }

    @PutMapping("/{id}/handle")
    public ResponseEntity<AlertRecord> handleAlert(
            @PathVariable Long id,
            @RequestParam String handler,
            @RequestParam String handleMeasure) {
        AlertRecord handledAlert = alertService.handleAlert(id, handler, handleMeasure);
        return ResponseEntity.ok(handledAlert);
    }
}