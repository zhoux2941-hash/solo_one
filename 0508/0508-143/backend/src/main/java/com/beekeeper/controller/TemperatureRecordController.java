package com.beekeeper.controller;

import com.beekeeper.dto.TemperatureRecordDTO;
import com.beekeeper.entity.TemperatureRecord;
import com.beekeeper.service.TemperatureRecordService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/temperature")
@RequiredArgsConstructor
public class TemperatureRecordController {
    
    private final TemperatureRecordService temperatureRecordService;
    
    @GetMapping("/range")
    public ResponseEntity<List<TemperatureRecord>> getRecordsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(temperatureRecordService.getTemperatureRecordsByDateRange(startDate, endDate));
    }
    
    @GetMapping("/{date}")
    public ResponseEntity<TemperatureRecord> getRecordByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(temperatureRecordService.getTemperatureRecordByDate(date));
    }
    
    @PostMapping
    public ResponseEntity<TemperatureRecord> createRecord(@Valid @RequestBody TemperatureRecordDTO dto) {
        return ResponseEntity.ok(temperatureRecordService.createTemperatureRecord(dto));
    }
    
    @PostMapping("/upsert")
    public ResponseEntity<TemperatureRecord> upsertRecord(@Valid @RequestBody TemperatureRecordDTO dto) {
        return ResponseEntity.ok(temperatureRecordService.upsertTemperatureRecord(dto));
    }
    
    @PostMapping("/batch")
    public ResponseEntity<List<TemperatureRecord>> batchCreateRecords(@Valid @RequestBody List<TemperatureRecordDTO> dtos) {
        return ResponseEntity.ok(temperatureRecordService.batchCreateTemperatureRecords(dtos));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<TemperatureRecord> updateRecord(
            @PathVariable Long id,
            @Valid @RequestBody TemperatureRecordDTO dto) {
        return ResponseEntity.ok(temperatureRecordService.updateTemperatureRecord(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        temperatureRecordService.deleteTemperatureRecord(id);
        return ResponseEntity.ok().build();
    }
}
