package com.campsite.controller;

import com.campsite.entity.UsageRecord;
import com.campsite.service.UsageRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/usage")
public class UsageRecordController {

    @Autowired
    private UsageRecordService usageRecordService;

    @GetMapping
    public List<UsageRecord> getAllUsageRecords() {
        return usageRecordService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getUsageRecordsByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String maintenance) {
        Page<UsageRecord> pageResult;
        if (type != null && !type.isEmpty()) {
            pageResult = usageRecordService.findByRecordType(type, page, size);
        } else if (maintenance != null && !maintenance.isEmpty()) {
            pageResult = usageRecordService.findByMaintenanceStatus(maintenance, page, size);
        } else {
            pageResult = usageRecordService.findAll(page, size);
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", pageResult.getContent());
        response.put("totalPages", pageResult.getTotalPages());
        response.put("totalElements", pageResult.getTotalElements());
        response.put("currentPage", pageResult.getNumber());
        response.put("pageSize", pageResult.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsageRecord> getUsageRecordById(@PathVariable Long id) {
        Optional<UsageRecord> record = usageRecordService.findById(id);
        return record.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/type/{recordType}")
    public List<UsageRecord> getUsageRecordsByType(@PathVariable String recordType) {
        return usageRecordService.findByRecordType(recordType);
    }

    @GetMapping("/area/{areaId}")
    public List<UsageRecord> getUsageRecordsByAreaId(@PathVariable Long areaId) {
        return usageRecordService.findByAreaId(areaId);
    }

    @GetMapping("/maintenance/{status}")
    public List<UsageRecord> getUsageRecordsByMaintenanceStatus(@PathVariable String status) {
        return usageRecordService.findByMaintenanceStatus(status);
    }

    @PostMapping
    public UsageRecord createUsageRecord(@RequestBody UsageRecord usageRecord) {
        return usageRecordService.save(usageRecord);
    }

    @PutMapping("/{id}")
    public ResponseEntity<UsageRecord> updateUsageRecord(@PathVariable Long id, @RequestBody UsageRecord usageRecord) {
        UsageRecord updated = usageRecordService.update(id, usageRecord);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUsageRecord(@PathVariable Long id) {
        usageRecordService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
