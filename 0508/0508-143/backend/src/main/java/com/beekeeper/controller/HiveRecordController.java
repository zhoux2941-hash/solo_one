package com.beekeeper.controller;

import com.beekeeper.dto.HiveRecordDTO;
import com.beekeeper.entity.HiveRecord;
import com.beekeeper.service.HiveRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@RequiredArgsConstructor
public class HiveRecordController {
    
    private final HiveRecordService hiveRecordService;
    
    @GetMapping("/beehive/{beehiveId}")
    public ResponseEntity<List<HiveRecord>> getRecordsByBeehive(@PathVariable Long beehiveId) {
        return ResponseEntity.ok(hiveRecordService.getRecordsByBeehive(beehiveId));
    }
    
    @GetMapping("/beehive/{beehiveId}/range")
    public ResponseEntity<List<HiveRecord>> getRecordsByBeehiveAndDateRange(
            @PathVariable Long beehiveId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(hiveRecordService.getRecordsByBeehiveAndDateRange(beehiveId, startDate, endDate));
    }
    
    @GetMapping("/beehive/{beehiveId}/today")
    public ResponseEntity<HiveRecord> getTodayRecord(@PathVariable Long beehiveId) {
        return ResponseEntity.ok(hiveRecordService.getTodayRecord(beehiveId));
    }
    
    @PostMapping
    public ResponseEntity<HiveRecord> createRecord(@Valid @RequestBody HiveRecordDTO dto) {
        return ResponseEntity.ok(hiveRecordService.createRecord(dto));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<HiveRecord> updateRecord(@PathVariable Long id, @Valid @RequestBody HiveRecordDTO dto) {
        return ResponseEntity.ok(hiveRecordService.updateRecord(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        hiveRecordService.deleteRecord(id);
        return ResponseEntity.ok().build();
    }
}
