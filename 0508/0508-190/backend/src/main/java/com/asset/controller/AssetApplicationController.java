package com.asset.controller;

import com.asset.model.ApplicationStatus;
import com.asset.model.AssetApplication;
import com.asset.service.AssetApplicationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class AssetApplicationController {

    @Autowired
    private AssetApplicationService applicationService;

    @GetMapping
    public List<AssetApplication> getAllApplications() {
        return applicationService.getAllApplications();
    }

    @GetMapping("/page")
    public Map<String, Object> getAllApplicationsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AssetApplication> appPage = applicationService.getAllApplications(page, size);
        Map<String, Object> result = new HashMap<>();
        result.put("content", appPage.getContent());
        result.put("totalElements", appPage.getTotalElements());
        result.put("totalPages", appPage.getTotalPages());
        result.put("currentPage", appPage.getNumber());
        result.put("pageSize", appPage.getSize());
        return result;
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssetApplication> getApplicationById(@PathVariable Long id) {
        return applicationService.getApplicationById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<AssetApplication> getApplicationsByStatus(@PathVariable ApplicationStatus status) {
        return applicationService.getApplicationsByStatus(status);
    }

    @GetMapping("/status/{status}/page")
    public Map<String, Object> getApplicationsByStatusPage(
            @PathVariable ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<AssetApplication> appPage = applicationService.getApplicationsByStatus(status, page, size);
        Map<String, Object> result = new HashMap<>();
        result.put("content", appPage.getContent());
        result.put("totalElements", appPage.getTotalElements());
        result.put("totalPages", appPage.getTotalPages());
        result.put("currentPage", appPage.getNumber());
        result.put("pageSize", appPage.getSize());
        return result;
    }

    @PostMapping
    public ResponseEntity<?> createApplication(@RequestBody AssetApplication application) {
        try {
            AssetApplication created = applicationService.createApplication(application);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveApplication(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String approver = body.getOrDefault("approver", "IT Admin");
            AssetApplication approved = applicationService.approveApplication(id, approver);
            return ResponseEntity.ok(approved);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectApplication(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            String approver = body.getOrDefault("approver", "IT Admin");
            String reason = body.getOrDefault("reason", "");
            AssetApplication rejected = applicationService.rejectApplication(id, approver, reason);
            return ResponseEntity.ok(rejected);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}
