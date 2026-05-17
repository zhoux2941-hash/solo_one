package com.campsite.controller;

import com.campsite.entity.CampRecord;
import com.campsite.service.CampRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/records")
public class CampRecordController {

    @Autowired
    private CampRecordService campRecordService;

    @GetMapping
    public List<CampRecord> getAllRecords() {
        return campRecordService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getRecordsByPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        Page<CampRecord> pageResult;
        if (status != null && !status.isEmpty()) {
            pageResult = campRecordService.findByStatus(status, page, size);
        } else {
            pageResult = campRecordService.findAll(page, size);
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
    public ResponseEntity<CampRecord> getRecordById(@PathVariable Long id) {
        Optional<CampRecord> record = campRecordService.findById(id);
        return record.map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/status/{status}")
    public List<CampRecord> getRecordsByStatus(@PathVariable String status) {
        return campRecordService.findByStatus(status);
    }

    @GetMapping("/area/{campAreaId}")
    public List<CampRecord> getRecordsByAreaId(@PathVariable Long campAreaId) {
        return campRecordService.findByCampAreaId(campAreaId);
    }

    @PostMapping
    public CampRecord createRecord(@RequestBody CampRecord campRecord) {
        return campRecordService.save(campRecord);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CampRecord> updateRecord(@PathVariable Long id, @RequestBody CampRecord campRecord) {
        CampRecord updated = campRecordService.update(id, campRecord);
        return updated != null ? ResponseEntity.ok(updated) : ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        campRecordService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
