package com.isstracker.controller;

import com.isstracker.dto.ObservationRequest;
import com.isstracker.entity.ObservationRecord;
import com.isstracker.service.ObservationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/observations")
public class ObservationController {
    
    @Autowired
    private ObservationService observationService;
    
    @PostMapping
    public ResponseEntity<?> createObservation(@Valid @RequestBody ObservationRequest request) {
        ObservationRecord record = observationService.recordObservation(request);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "观测记录已保存");
        response.put("id", record.getId());
        response.put("passEventId", record.getPassEventId());
        response.put("observerCount", observationService.getObserverCount(request.getPassEventId()));
        
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
    
    @GetMapping("/pass/{passEventId}")
    public ResponseEntity<?> getObservationsByPassEvent(@PathVariable String passEventId) {
        List<ObservationRecord> records = observationService.getObservationsByPassEvent(passEventId);
        Integer count = observationService.getObserverCount(passEventId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("passEventId", passEventId);
        response.put("observerCount", count);
        response.put("observations", records);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/count/{passEventId}")
    public ResponseEntity<?> getObserverCount(@PathVariable String passEventId) {
        Integer count = observationService.getObserverCount(passEventId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("passEventId", passEventId);
        response.put("observerCount", count);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/heatmap")
    public ResponseEntity<?> getHeatmapData() {
        List<ObservationRecord> records = observationService.getAllObservations();
        
        List<Map<String, Object>> heatmapPoints = records.stream()
                .map(record -> {
                    Map<String, Object> point = new HashMap<>();
                    point.put("lat", record.getLatitude());
                    point.put("lng", record.getLongitude());
                    point.put("passEventId", record.getPassEventId());
                    point.put("description", record.getDescription());
                    point.put("observedAt", record.getObservedAt());
                    return point;
                })
                .collect(java.util.stream.Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("total", heatmapPoints.size());
        response.put("points", heatmapPoints);
        
        return ResponseEntity.ok(response);
    }
}
