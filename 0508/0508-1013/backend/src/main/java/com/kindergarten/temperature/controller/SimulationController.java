package com.kindergarten.temperature.controller;

import com.kindergarten.temperature.service.TemperatureSimulationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/simulation")
public class SimulationController {

    @Autowired
    private TemperatureSimulationService simulationService;

    @PostMapping("/start")
    public ResponseEntity<Map<String, Object>> startSimulation() {
        simulationService.startSimulation();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "模拟数据生成已启动");
        response.put("running", true);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/stop")
    public ResponseEntity<Map<String, Object>> stopSimulation() {
        simulationService.stopSimulation();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "模拟数据生成已停止");
        response.put("running", false);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> response = new HashMap<>();
        response.put("running", simulationService.isSimulationRunning());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/init-data")
    public ResponseEntity<Map<String, Object>> generateInitialData() {
        simulationService.generateInitialData();
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "初始数据生成完成");
        return ResponseEntity.ok(response);
    }
}
