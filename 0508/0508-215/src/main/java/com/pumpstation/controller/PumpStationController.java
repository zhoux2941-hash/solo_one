package com.pumpstation.controller;

import com.pumpstation.entity.OperationRecord;
import com.pumpstation.entity.PumpStation;
import com.pumpstation.entity.WaterLevelRecord;
import com.pumpstation.service.PumpStationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pumps")
@CrossOrigin(origins = "*")
public class PumpStationController {
    
    @Autowired
    private PumpStationService pumpStationService;
    
    @GetMapping
    public ResponseEntity<List<PumpStation>> getAllPumpStations() {
        return ResponseEntity.ok(pumpStationService.getAllPumpStations());
    }
    
    @GetMapping("/{pumpNo}")
    public ResponseEntity<PumpStation> getPumpStation(@PathVariable String pumpNo) {
        return pumpStationService.getPumpStationByPumpNo(pumpNo)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<PumpStation> createPumpStation(@RequestBody PumpStation pumpStation) {
        try {
            PumpStation created = pumpStationService.createPumpStation(pumpStation);
            return ResponseEntity.ok(created);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PutMapping("/{pumpNo}")
    public ResponseEntity<PumpStation> updatePumpStation(
            @PathVariable String pumpNo,
            @RequestBody PumpStation pumpStation) {
        try {
            PumpStation updated = pumpStationService.updatePumpStation(pumpNo, pumpStation);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PostMapping("/{pumpNo}/water-level")
    public ResponseEntity<Map<String, Object>> reportWaterLevel(
            @PathVariable String pumpNo,
            @RequestBody Map<String, Double> request) {
        Double waterLevel = request.get("waterLevel");
        if (waterLevel == null) {
            return ResponseEntity.badRequest().build();
        }
        
        try {
            WaterLevelRecord record = pumpStationService.reportWaterLevel(pumpNo, waterLevel);
            PumpStation pumpStation = pumpStationService.getPumpStationByPumpNo(pumpNo).orElse(null);
            
            Map<String, Object> response = new HashMap<>();
            response.put("record", record);
            response.put("isRunning", pumpStation != null && pumpStation.getIsRunning());
            
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{pumpNo}/water-level/history")
    public ResponseEntity<List<WaterLevelRecord>> getWaterLevelHistory(@PathVariable String pumpNo) {
        return ResponseEntity.ok(pumpStationService.getWaterLevelHistory(pumpNo));
    }
    
    @GetMapping("/{pumpNo}/operations")
    public ResponseEntity<List<OperationRecord>> getOperationHistory(@PathVariable String pumpNo) {
        return ResponseEntity.ok(pumpStationService.getOperationHistory(pumpNo));
    }
    
    @PostMapping("/{pumpNo}/start")
    public ResponseEntity<Map<String, String>> manualStartPump(@PathVariable String pumpNo) {
        try {
            pumpStationService.manualStartPump(pumpNo);
            Map<String, String> response = new HashMap<>();
            response.put("message", "水泵启动成功");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    @PostMapping("/{pumpNo}/stop")
    public ResponseEntity<Map<String, String>> manualStopPump(@PathVariable String pumpNo) {
        try {
            pumpStationService.manualStopPump(pumpNo);
            Map<String, String> response = new HashMap<>();
            response.put("message", "水泵停止成功");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
