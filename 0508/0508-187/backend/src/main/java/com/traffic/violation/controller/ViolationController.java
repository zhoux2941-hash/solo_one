package com.traffic.violation.controller;

import com.traffic.violation.entity.Violation;
import com.traffic.violation.service.ViolationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/violations")
@CrossOrigin(origins = "*")
public class ViolationController {

    @Autowired
    private ViolationService violationService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createViolation(@RequestBody Violation violation) {
        Map<String, Object> response = new HashMap<>();
        try {
            Violation created = violationService.createViolation(violation);
            response.put("success", true);
            response.put("message", "违章记录录入成功");
            response.put("violation", created);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "录入失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/plate/{plateNumber}")
    public ResponseEntity<Map<String, Object>> getViolationsByPlateNumber(@PathVariable String plateNumber) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Violation> violations = violationService.getViolationsByPlateNumber(plateNumber);
            Integer totalPoints = violationService.getTotalPoints(plateNumber);
            boolean isSuspended = violationService.isLicenseSuspended(plateNumber);

            response.put("success", true);
            response.put("violations", violations);
            response.put("totalPoints", totalPoints);
            response.put("isSuspended", isSuspended);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/plate/{plateNumber}/unpaid")
    public ResponseEntity<Map<String, Object>> getUnpaidViolationsByPlateNumber(@PathVariable String plateNumber) {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Violation> violations = violationService.getUnpaidViolationsByPlateNumber(plateNumber);
            Integer unpaidPoints = violationService.getTotalUnpaidPoints(plateNumber);
            Integer totalPoints = violationService.getTotalPoints(plateNumber);
            boolean isSuspended = violationService.isLicenseSuspended(plateNumber);

            response.put("success", true);
            response.put("violations", violations);
            response.put("unpaidPoints", unpaidPoints);
            response.put("totalPoints", totalPoints);
            response.put("isSuspended", isSuspended);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/pay")
    public ResponseEntity<Map<String, Object>> payViolation(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Violation paid = violationService.payViolation(id);
            response.put("success", true);
            response.put("message", "缴费成功");
            response.put("violation", paid);
        } catch (RuntimeException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "缴费失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/paged")
    public ResponseEntity<Map<String, Object>> getAllViolationsPaged(@RequestParam(defaultValue = "0") int page) {
        Map<String, Object> response = new HashMap<>();
        try {
            org.springframework.data.domain.Page<Violation> violationPage = violationService.getAllViolationsPaged(page);
            response.put("success", true);
            response.put("violations", violationPage.getContent());
            response.put("currentPage", violationPage.getNumber());
            response.put("totalPages", violationPage.getTotalPages());
            response.put("totalItems", violationPage.getTotalElements());
            response.put("pageSize", violationPage.getSize());
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllViolations() {
        Map<String, Object> response = new HashMap<>();
        try {
            List<Violation> violations = violationService.getAllViolations();
            response.put("success", true);
            response.put("violations", violations);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getViolationById(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Violation violation = violationService.getViolationById(id);
            if (violation != null) {
                response.put("success", true);
                response.put("violation", violation);
            } else {
                response.put("success", false);
                response.put("message", "违章记录不存在");
            }
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "查询失败: " + e.getMessage());
        }
        return ResponseEntity.ok(response);
    }
}
