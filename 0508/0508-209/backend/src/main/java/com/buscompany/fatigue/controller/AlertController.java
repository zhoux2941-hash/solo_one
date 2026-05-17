package com.buscompany.fatigue.controller;

import com.buscompany.fatigue.entity.Alert;
import com.buscompany.fatigue.repository.AlertRepository;
import com.buscompany.fatigue.service.FatigueMonitorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alerts")
@CrossOrigin(origins = "*")
public class AlertController {
    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private FatigueMonitorService monitorService;

    @GetMapping("/unhandled")
    public ResponseEntity<List<Alert>> getUnhandledAlerts() {
        List<Alert> alerts = alertRepository.findByHandledFalseOrderByAlertTimeDesc();
        return ResponseEntity.ok(alerts);
    }

    @GetMapping("/driver/{driverNo}")
    public ResponseEntity<List<Alert>> getAlertsByDriver(@PathVariable String driverNo) {
        List<Alert> alerts = alertRepository.findByDriverNoOrderByAlertTimeDesc(driverNo);
        return ResponseEntity.ok(alerts);
    }

    @PostMapping("/{id}/handle")
    public ResponseEntity<Map<String, Object>> handleAlert(@PathVariable Long id, @RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String handledBy = request.get("handledBy");

        if (handledBy == null || handledBy.isEmpty()) {
            handledBy = "调度员";
        }

        Alert alert = monitorService.handleAlert(id, handledBy);
        if (alert != null) {
            response.put("success", true);
            response.put("message", "告警已处理");
            response.put("data", alert);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "告警不存在");
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/all")
    public ResponseEntity<List<Alert>> getAllAlerts() {
        List<Alert> alerts = alertRepository.findAll();
        alerts.sort((a, b) -> b.getAlertTime().compareTo(a.getAlertTime()));
        return ResponseEntity.ok(alerts);
    }
}
