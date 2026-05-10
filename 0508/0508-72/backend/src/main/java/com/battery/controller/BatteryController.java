package com.battery.controller;

import com.battery.dto.MultiDayRequest;
import com.battery.dto.MultiDayResponse;
import com.battery.dto.SimulationRequest;
import com.battery.dto.SimulationResponse;
import com.battery.entity.SimulationLog;
import com.battery.repository.SimulationLogRepository;
import com.battery.service.BatterySimulationService;
import com.battery.service.MultiDaySimulationService;
import com.battery.service.SimulationHistoryService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/battery")
public class BatteryController {

    private final BatterySimulationService simulationService;
    private final MultiDaySimulationService multiDaySimulationService;
    private final SimulationHistoryService historyService;
    
    @Autowired(required = false)
    private SimulationLogRepository logRepository;

    public BatteryController(BatterySimulationService simulationService, 
                            MultiDaySimulationService multiDaySimulationService,
                            SimulationHistoryService historyService) {
        this.simulationService = simulationService;
        this.multiDaySimulationService = multiDaySimulationService;
        this.historyService = historyService;
    }

    @PostMapping("/simulate")
    public ResponseEntity<?> simulate(@Valid @RequestBody SimulationRequest request) {
        SimulationResponse response = simulationService.simulate(request);
        historyService.save(response);
        
        if (logRepository != null) {
            try {
                logRepository.save(SimulationLog.fromResponse(response));
            } catch (Exception e) {
                System.err.println("MySQL日志保存失败: " + e.getMessage());
            }
        }
        
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", response);
        
        return ResponseEntity.ok(result);
    }

    @PostMapping("/simulate/multi-day")
    public ResponseEntity<?> simulateMultiDay(@Valid @RequestBody MultiDayRequest request) {
        MultiDayResponse response = multiDaySimulationService.simulate(request);
        
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", response);
        
        return ResponseEntity.ok(result);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getHistory() {
        List<SimulationResponse> history = historyService.getRecent();
        
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", history);
        
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/history")
    public ResponseEntity<?> clearHistory() {
        historyService.clear();
        
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "History cleared");
        
        return ResponseEntity.ok(result);
    }
    
    @GetMapping("/logs")
    public ResponseEntity<?> getLogs() {
        List<SimulationLog> logs = (logRepository != null) ? 
            logRepository.findTop50ByOrderByCreatedAtDesc() : null;
        
        Map<String, Object> result = new HashMap<>();
        result.put("code", 200);
        result.put("message", "success");
        result.put("data", logs);
        
        return ResponseEntity.ok(result);
    }
}