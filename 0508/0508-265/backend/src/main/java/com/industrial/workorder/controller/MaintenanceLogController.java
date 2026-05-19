package com.industrial.workorder.controller;

import com.industrial.workorder.entity.MaintenanceLog;
import com.industrial.workorder.service.MaintenanceLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/maintenance-logs")
@CrossOrigin(origins = "*")
public class MaintenanceLogController {

    @Autowired
    private MaintenanceLogService maintenanceLogService;

    @GetMapping
    public List<MaintenanceLog> findAll() {
        return maintenanceLogService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<MaintenanceLog> findById(@PathVariable Long id) {
        Optional<MaintenanceLog> log = maintenanceLogService.findById(id);
        return log.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/workorder/{workOrderId}")
    public List<MaintenanceLog> findByWorkOrderId(@PathVariable Long workOrderId) {
        return maintenanceLogService.findByWorkOrderId(workOrderId);
    }

    @GetMapping("/device/{deviceId}")
    public List<MaintenanceLog> findByDeviceId(@PathVariable Long deviceId) {
        return maintenanceLogService.findByDeviceId(deviceId);
    }

    @GetMapping("/maintainer/{maintainerId}")
    public List<MaintenanceLog> findByMaintainerId(@PathVariable Long maintainerId) {
        return maintenanceLogService.findByMaintainerId(maintainerId);
    }

    @PostMapping
    public MaintenanceLog create(@RequestBody MaintenanceLog log) {
        return maintenanceLogService.save(log);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MaintenanceLog> update(@PathVariable Long id, @RequestBody MaintenanceLog log) {
        if (!maintenanceLogService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        log.setId(id);
        return ResponseEntity.ok(maintenanceLogService.save(log));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!maintenanceLogService.findById(id).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        maintenanceLogService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
