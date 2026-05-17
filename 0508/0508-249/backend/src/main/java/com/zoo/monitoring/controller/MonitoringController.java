package com.zoo.monitoring.controller;

import com.zoo.monitoring.entity.MonitoringData;
import com.zoo.monitoring.service.MonitoringService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/monitoring")
@CrossOrigin(origins = "*")
public class MonitoringController {
    @Autowired
    private MonitoringService monitoringService;

    @GetMapping
    public List<MonitoringData> getAllMonitoringData() {
        return monitoringService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getMonitoringDataPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "monitorTime"));
        Page<MonitoringData> dataPage = monitoringService.findAll(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", dataPage.getContent());
        response.put("totalElements", dataPage.getTotalElements());
        response.put("totalPages", dataPage.getTotalPages());
        response.put("currentPage", dataPage.getNumber());
        response.put("pageSize", dataPage.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<MonitoringData> getMonitoringDataById(@PathVariable Long id) {
        return monitoringService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/bird/{birdId}")
    public List<MonitoringData> getMonitoringDataByBirdId(@PathVariable Long birdId) {
        return monitoringService.findByBirdId(birdId);
    }

    @PostMapping
    public MonitoringData createMonitoringData(@Valid @RequestBody MonitoringData data) {
        return monitoringService.save(data);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteMonitoringData(@PathVariable Long id) {
        return monitoringService.findById(id)
                .map(data -> {
                    monitoringService.delete(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
