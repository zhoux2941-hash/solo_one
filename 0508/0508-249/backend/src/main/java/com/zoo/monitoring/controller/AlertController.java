package com.zoo.monitoring.controller;

import com.zoo.monitoring.entity.Alert;
import com.zoo.monitoring.service.AlertService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
    private AlertService alertService;

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getAlertsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "alertTime"));
        Page<Alert> alertPage = alertService.findAll(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", alertPage.getContent());
        response.put("totalElements", alertPage.getTotalElements());
        response.put("totalPages", alertPage.getTotalPages());
        response.put("currentPage", alertPage.getNumber());
        response.put("pageSize", alertPage.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable Long id) {
        return alertService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/unhandled")
    public List<Alert> getUnhandledAlerts() {
        return alertService.findUnhandledAlerts();
    }

    @GetMapping("/level/{level}")
    public List<Alert> getAlertsByLevel(@PathVariable String level) {
        return alertService.findByAlertLevel(level);
    }

    @PutMapping("/{id}/handle")
    public ResponseEntity<Alert> handleAlert(@PathVariable Long id) {
        try {
            Alert alert = alertService.handleAlert(id);
            return ResponseEntity.ok(alert);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAlert(@PathVariable Long id) {
        return alertService.findById(id)
                .map(alert -> {
                    alertService.delete(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
