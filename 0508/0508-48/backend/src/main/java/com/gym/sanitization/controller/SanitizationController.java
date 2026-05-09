package com.gym.sanitization.controller;

import com.gym.sanitization.dto.BatchSanitizationRequest;
import com.gym.sanitization.dto.ComplianceStatsDTO;
import com.gym.sanitization.dto.DailyStatusDTO;
import com.gym.sanitization.dto.HeatmapDataDTO;
import com.gym.sanitization.dto.SanitizationRequest;
import com.gym.sanitization.entity.SanitizationRecord;
import com.gym.sanitization.service.SanitizationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sanitization")
public class SanitizationController {

    private static final Logger logger = LoggerFactory.getLogger(SanitizationController.class);

    @Autowired
    private SanitizationService sanitizationService;

    @PostMapping("/record")
    public ResponseEntity<Map<String, Object>> recordSanitization(@RequestBody SanitizationRequest request) {
        logger.info("Recording sanitization for equipment ID: {}", request.getEquipmentId());
        try {
            SanitizationRecord record = sanitizationService.recordSanitization(request);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Sanitization recorded successfully",
                "data", record
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false,
                "message", e.getMessage()
            ));
        } catch (Exception e) {
            logger.error("Error recording sanitization", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }

    @GetMapping("/today-status")
    public ResponseEntity<Map<String, Object>> getTodayStatus() {
        logger.info("Getting today's sanitization status");
        try {
            List<DailyStatusDTO> statusList = sanitizationService.getTodayStatus();
            long sanitizedCount = statusList.stream().filter(DailyStatusDTO::isSanitized).count();
            long unsanitizedCount = statusList.size() - sanitizedCount;

            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", statusList,
                "total", statusList.size(),
                "sanitizedCount", sanitizedCount,
                "unsanitizedCount", unsanitizedCount
            ));
        } catch (Exception e) {
            logger.error("Error getting today's status", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }

    @GetMapping("/heatmap")
    public ResponseEntity<Map<String, Object>> getHeatmap() {
        logger.info("Getting heatmap data");
        try {
            List<HeatmapDataDTO> heatmapData = sanitizationService.getLast7DaysHeatmap();
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", heatmapData
            ));
        } catch (Exception e) {
            logger.error("Error getting heatmap data", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }

    @GetMapping("/equipment/{equipmentId}")
    public ResponseEntity<Map<String, Object>> getRecordsByEquipment(@PathVariable Long equipmentId) {
        logger.info("Getting sanitization records for equipment ID: {}", equipmentId);
        try {
            List<SanitizationRecord> records = sanitizationService.getRecordsByEquipmentId(equipmentId);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", records
            ));
        } catch (Exception e) {
            logger.error("Error getting records", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }

    @PostMapping("/batch-record")
    public ResponseEntity<Map<String, Object>> batchRecordSanitization(@RequestBody BatchSanitizationRequest request) {
        logger.info("Batch recording sanitization for {} equipments", request.getEquipmentIds().size());
        try {
            if (request.getEquipmentIds() == null || request.getEquipmentIds().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "No equipment IDs provided"
                ));
            }
            List<SanitizationRecord> records = sanitizationService.batchRecordSanitization(
                request.getEquipmentIds(),
                request.getInspectorName(),
                request.getPhotoBase64()
            );
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Batch sanitization recorded successfully",
                "data", records,
                "count", records.size()
            ));
        } catch (Exception e) {
            logger.error("Error batch recording sanitization", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }

    @GetMapping("/compliance-stats")
    public ResponseEntity<Map<String, Object>> getComplianceStats(
            @RequestParam(defaultValue = "LAST_7_DAYS") String period) {
        logger.info("Getting compliance stats for period: {}", period);
        try {
            ComplianceStatsDTO stats = sanitizationService.getComplianceStats(period);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "data", stats
            ));
        } catch (Exception e) {
            logger.error("Error getting compliance stats", e);
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "message", "Internal server error"
            ));
        }
    }
}
