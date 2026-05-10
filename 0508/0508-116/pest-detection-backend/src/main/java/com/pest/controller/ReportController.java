package com.pest.controller;

import com.pest.dto.DiagnosisRequest;
import com.pest.dto.EvaluationRequest;
import com.pest.dto.ReportRequest;
import com.pest.entity.Report;
import com.pest.service.NotificationService;
import com.pest.service.ReportService;
import com.pest.service.UserService;
import com.pest.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report")
public class ReportController {

    @Autowired
    private ReportService reportService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(
            @Validated @RequestPart("data") ReportRequest request,
            @RequestPart(value = "images", required = false) List<MultipartFile> images) {
        try {
            Report report = reportService.createReport(request, images);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "上报成功");
            result.put("data", report);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", "上传失败: " + e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @PutMapping("/{id}/diagnose")
    public ResponseEntity<?> diagnose(@PathVariable Long id, @Validated @RequestBody DiagnosisRequest request) {
        try {
            Report report = reportService.diagnose(id, request);
            try {
                User expert = userService.getById(request.getExpertId());
                notificationService.notifyDiagnosisComplete(report, expert);
            } catch (Exception ignored) {
            }
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "诊断完成");
            result.put("data", report);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @PutMapping("/{id}/evaluate")
    public ResponseEntity<?> evaluate(@PathVariable Long id, @Validated @RequestBody EvaluationRequest request) {
        try {
            Report report = reportService.evaluate(id, request.getEvaluation());
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("message", "评价成功");
            result.put("data", report);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    @GetMapping("/farmer/{farmerId}")
    public ResponseEntity<?> getByFarmer(@PathVariable Long farmerId) {
        List<Report> reports = reportService.getByFarmer(farmerId);
        List<Map<String, Object>> enriched = enrichReports(reports);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", enriched);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/pending")
    public ResponseEntity<?> getPending() {
        List<Report> reports = reportService.getPending();
        List<Map<String, Object>> enriched = enrichReports(reports);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", enriched);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/recent")
    public ResponseEntity<?> getRecent() {
        List<Report> reports = reportService.getRecentReports();
        List<Map<String, Object>> enriched = enrichReports(reports);
        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("data", enriched);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        try {
            Report report = reportService.getById(id);
            Map<String, Object> enriched = enrichReport(report);
            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("data", enriched);
            return ResponseEntity.ok(result);
        } catch (RuntimeException e) {
            Map<String, Object> result = new HashMap<>();
            result.put("success", false);
            result.put("message", e.getMessage());
            return ResponseEntity.ok(result);
        }
    }

    private List<Map<String, Object>> enrichReports(List<Report> reports) {
        List<Map<String, Object>> list = new ArrayList<>();
        for (Report r : reports) {
            list.add(enrichReport(r));
        }
        return list;
    }

    private Map<String, Object> enrichReport(Report report) {
        Map<String, Object> map = new HashMap<>();
        map.put("id", report.getId());
        map.put("farmerId", report.getFarmerId());
        map.put("cropType", report.getCropType());
        map.put("description", report.getDescription());
        map.put("area", report.getArea());
        map.put("images", report.getImages());
        map.put("status", report.getStatus());
        map.put("expertId", report.getExpertId());
        map.put("diagnosisText", report.getDiagnosisText());
        map.put("pestName", report.getPestName());
        map.put("medicineSuggestion", report.getMedicineSuggestion());
        map.put("severity", report.getSeverity());
        map.put("evaluation", report.getEvaluation());
        map.put("reportTime", report.getReportTime());
        map.put("diagnosisTime", report.getDiagnosisTime());
        map.put("evaluationTime", report.getEvaluationTime());

        try {
            User farmer = userService.getById(report.getFarmerId());
            map.put("farmerName", farmer.getName());
            map.put("farmerPhone", farmer.getPhone());
        } catch (Exception ignored) {
            map.put("farmerName", "未知");
            map.put("farmerPhone", "");
        }

        if (report.getExpertId() != null) {
            try {
                User expert = userService.getById(report.getExpertId());
                map.put("expertName", expert.getName());
            } catch (Exception ignored) {
                map.put("expertName", "未知");
            }
        }

        return map;
    }
}