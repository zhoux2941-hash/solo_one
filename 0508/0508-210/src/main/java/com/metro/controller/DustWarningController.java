package com.metro.controller;

import com.metro.entity.DustSensorData;
import com.metro.entity.TunnelSection;
import com.metro.entity.VentilationRecord;
import com.metro.entity.WarningRecord;
import com.metro.service.DustWarningService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class DustWarningController {

    @Autowired
    private DustWarningService dustWarningService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @PostMapping("/dust/report")
    public ResponseEntity<Map<String, Object>> reportDustData(@RequestBody Map<String, Object> request) {
        String sectionId = (String) request.get("sectionId");
        Double pm25 = ((Number) request.get("pm25")).doubleValue();
        Double pm10 = ((Number) request.get("pm10")).doubleValue();

        Map<String, Object> result = dustWarningService.reportDustData(sectionId, pm25, pm10);

        messagingTemplate.convertAndSend("/topic/dust-data", result);

        Boolean isNewWarning = (Boolean) result.get("isNewWarning");
        if (isNewWarning != null && isNewWarning) {
            messagingTemplate.convertAndSend("/topic/warnings", result.get("warningRecord"));
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ventilation/start")
    public ResponseEntity<Map<String, Object>> startVentilation(@RequestBody Map<String, Object> request) {
        String sectionId = (String) request.get("sectionId");
        String reason = request.containsKey("reason") ? (String) request.get("reason") : "手动开启";

        List<DustSensorData> latestData = dustWarningService.getDustDataBySection(sectionId);
        Double pm25 = 0.0;
        Double pm10 = 0.0;
        if (!latestData.isEmpty()) {
            pm25 = latestData.get(0).getPm25();
            pm10 = latestData.get(0).getPm10();
        }

        TunnelSection section = dustWarningService.getAllTunnelSections().stream()
                .filter(s -> s.getSectionId().equals(sectionId))
                .findFirst()
                .orElse(null);

        if (section == null) {
            Map<String, Object> error = new HashMap<>();
            error.put("error", "隧道区间不存在");
            return ResponseEntity.badRequest().body(error);
        }

        VentilationRecord record = dustWarningService.startVentilation(sectionId, section.getSectionName(), pm25, pm10, reason);

        Map<String, Object> result = new HashMap<>();
        result.put("success", record != null);
        result.put("ventilationRecord", record);

        if (record != null) {
            messagingTemplate.convertAndSend("/topic/ventilation", record);
        }

        return ResponseEntity.ok(result);
    }

    @PostMapping("/ventilation/stop")
    public ResponseEntity<Map<String, Object>> stopVentilation(@RequestBody Map<String, Object> request) {
        String sectionId = (String) request.get("sectionId");

        VentilationRecord record = dustWarningService.stopVentilation(sectionId);

        Map<String, Object> result = new HashMap<>();
        result.put("success", record != null);
        result.put("ventilationRecord", record);

        if (record != null) {
            messagingTemplate.convertAndSend("/topic/ventilation", record);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/dust/latest")
    public ResponseEntity<List<DustSensorData>> getLatestDustData(@RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(dustWarningService.getLatestDustData(limit));
    }

    @GetMapping("/dust/section/{sectionId}")
    public ResponseEntity<List<DustSensorData>> getDustDataBySection(@PathVariable String sectionId) {
        return ResponseEntity.ok(dustWarningService.getDustDataBySection(sectionId));
    }

    @GetMapping("/warnings/active")
    public ResponseEntity<List<WarningRecord>> getActiveWarnings() {
        return ResponseEntity.ok(dustWarningService.getActiveWarnings());
    }

    @GetMapping("/warnings/all")
    public ResponseEntity<List<WarningRecord>> getAllWarnings() {
        return ResponseEntity.ok(dustWarningService.getAllWarnings());
    }

    @GetMapping("/sections")
    public ResponseEntity<List<TunnelSection>> getAllTunnelSections() {
        return ResponseEntity.ok(dustWarningService.getAllTunnelSections());
    }
}
