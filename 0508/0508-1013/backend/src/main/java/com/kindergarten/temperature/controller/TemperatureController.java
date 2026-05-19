package com.kindergarten.temperature.controller;

import com.kindergarten.temperature.dto.TemperatureSnapshot;
import com.kindergarten.temperature.entity.TemperatureRecord;
import com.kindergarten.temperature.repository.TemperatureRecordRepository;
import com.kindergarten.temperature.service.RedisSnapshotService;
import com.kindergarten.temperature.service.TemperatureDetectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/temperature")
public class TemperatureController {

    @Autowired
    private TemperatureRecordRepository recordRepository;

    @Autowired
    private TemperatureDetectionService detectionService;

    @Autowired
    private RedisSnapshotService snapshotService;

    @PostMapping("/record")
    public ResponseEntity<TemperatureRecord> recordTemperature(
            @RequestParam Integer bedNo,
            @RequestParam Double temperature) {
        TemperatureRecord record = detectionService.detectAndSave(bedNo, temperature);
        return ResponseEntity.ok(record);
    }

    @GetMapping("/history/{bedNo}")
    public ResponseEntity<List<TemperatureRecord>> getBedHistory(
            @PathVariable Integer bedNo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime,
            @RequestParam(required = false, defaultValue = "24") Integer limit) {

        List<TemperatureRecord> records;
        if (startTime != null && endTime != null) {
            records = recordRepository.findByBedNoAndRecordTimeBetweenOrderByRecordTimeDesc(
                    bedNo, startTime, endTime);
        } else {
            records = recordRepository.findLatestByBedNo(bedNo, PageRequest.of(0, limit));
        }
        return ResponseEntity.ok(records);
    }

    @GetMapping("/history")
    public ResponseEntity<List<TemperatureRecord>> getAllHistory(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {
        List<TemperatureRecord> records = recordRepository.findByRecordTimeBetweenOrderByRecordTimeDesc(
                startTime, endTime);
        return ResponseEntity.ok(records);
    }

    @GetMapping("/abnormal")
    public ResponseEntity<List<TemperatureRecord>> getAbnormalRecords() {
        return ResponseEntity.ok(recordRepository.findByAbnormalTrueOrderByRecordTimeDesc());
    }

    @GetMapping("/snapshot")
    public ResponseEntity<Map<String, Object>> getCurrentSnapshots() {
        List<TemperatureSnapshot> snapshots = snapshotService.getAllSnapshots();
        Map<String, Object> result = new HashMap<>();
        result.put("snapshots", snapshots);
        result.put("total", 12);
        result.put("abnormalCount", snapshots.stream().filter(s -> s.getAbnormal()).count());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/snapshot/{bedNo}")
    public ResponseEntity<TemperatureSnapshot> getBedSnapshot(@PathVariable Integer bedNo) {
        TemperatureSnapshot snapshot = snapshotService.getSnapshot(bedNo);
        if (snapshot != null) {
            return ResponseEntity.ok(snapshot);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testAbnormalDetection(
            @RequestParam Integer bedNo,
            @RequestParam Double temp1,
            @RequestParam Double temp2,
            @RequestParam Double temp3) {
        Map<String, Object> result = new HashMap<>();

        TemperatureRecord r1 = detectionService.detectAndSave(bedNo, temp1);
        TemperatureRecord r2 = detectionService.detectAndSave(bedNo, temp2);
        TemperatureRecord r3 = detectionService.detectAndSave(bedNo, temp3);

        result.put("record1", r1);
        result.put("record2", r2);
        result.put("record3", r3);
        result.put("finalAbnormal", r3.getAbnormal());
        result.put("finalAbnormalType", r3.getAbnormalType());
        result.put("finalMessage", r3.getAbnormalMessage());

        return ResponseEntity.ok(result);
    }
}
