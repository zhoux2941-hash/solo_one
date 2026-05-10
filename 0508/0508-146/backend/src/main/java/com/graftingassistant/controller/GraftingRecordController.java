package com.graftingassistant.controller;

import com.graftingassistant.dto.GraftingRecordDTO;
import com.graftingassistant.entity.GraftingRecord;
import com.graftingassistant.service.GraftingRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class GraftingRecordController {
    
    private final GraftingRecordService recordService;
    
    @PostMapping
    public ResponseEntity<GraftingRecord> createRecord(@RequestBody GraftingRecordDTO dto) {
        return ResponseEntity.ok(recordService.createRecord(dto));
    }
    
    @PutMapping("/{id}/survival")
    public ResponseEntity<GraftingRecord> updateSurvival(
            @PathVariable Long id,
            @RequestParam Integer survivalCount) {
        return ResponseEntity.ok(recordService.updateSurvival(id, survivalCount));
    }
    
    @GetMapping
    public ResponseEntity<List<GraftingRecord>> getAllRecords() {
        return ResponseEntity.ok(recordService.getAllRecords());
    }
    
    @GetMapping("/season-analysis")
    public ResponseEntity<Map<Integer, BigDecimal>> getBestGraftingSeason(
            @RequestParam Long rootstockId,
            @RequestParam Long scionId) {
        return ResponseEntity.ok(recordService.getBestGraftingSeason(rootstockId, scionId));
    }
}
