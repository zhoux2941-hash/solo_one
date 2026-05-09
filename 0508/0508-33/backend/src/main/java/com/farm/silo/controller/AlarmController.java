package com.farm.silo.controller;

import com.farm.silo.model.AlarmHistory;
import com.farm.silo.service.AlarmService;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/alarms")
public class AlarmController {

    private final AlarmService alarmService;

    public AlarmController(AlarmService alarmService) {
        this.alarmService = alarmService;
    }

    @GetMapping("/history")
    public ResponseEntity<Map<String, Object>> getAlarmHistory(
            @RequestParam(required = false, defaultValue = "all") String siloName,
            @RequestParam(required = false, defaultValue = "0") int page,
            @RequestParam(required = false, defaultValue = "20") int size) {
        
        Page<AlarmHistory> alarmPage = alarmService.getAlarmHistory(siloName, page, size);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", alarmPage.getContent());
        response.put("totalElements", alarmPage.getTotalElements());
        response.put("totalPages", alarmPage.getTotalPages());
        response.put("currentPage", alarmPage.getNumber());
        response.put("pageSize", alarmPage.getSize());
        response.put("hasNext", alarmPage.hasNext());
        response.put("hasPrevious", alarmPage.hasPrevious());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/unacknowledged")
    public ResponseEntity<List<AlarmHistory>> getUnacknowledgedAlarms() {
        List<AlarmHistory> alarms = alarmService.getUnacknowledgedAlarms();
        return ResponseEntity.ok(alarms);
    }

    @GetMapping("/silos")
    public ResponseEntity<List<String>> getAvailableSiloNames() {
        List<String> names = alarmService.getAvailableSiloNames();
        return ResponseEntity.ok(names);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAlarmStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalAlarms", alarmService.getTotalAlarmCount());
        stats.put("unacknowledgedCount", alarmService.getUnacknowledgedAlarms().size());
        stats.put("availableSilos", alarmService.getAvailableSiloNames());
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<Map<String, String>> acknowledgeAlarm(@PathVariable Long id) {
        alarmService.acknowledgeAlarm(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "报警已确认");
        response.put("id", String.valueOf(id));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/acknowledge-all")
    public ResponseEntity<Map<String, String>> acknowledgeAllAlarms() {
        alarmService.acknowledgeAllAlarms();
        Map<String, String> response = new HashMap<>();
        response.put("message", "所有报警已确认");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/threshold")
    public ResponseEntity<Map<String, Double>> getThreshold() {
        Map<String, Double> response = new HashMap<>();
        response.put("highTemperatureThreshold", AlarmService.HIGH_TEMPERATURE_THRESHOLD);
        return ResponseEntity.ok(response);
    }
}
