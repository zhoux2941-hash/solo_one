package com.meteor.controller;

import com.meteor.dto.MeteorRecordRequest;
import com.meteor.entity.MeteorRecord;
import com.meteor.service.MeteorRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/records")
@CrossOrigin(origins = "*")
public class MeteorRecordController {

    @Autowired
    private MeteorRecordService recordService;

    @PostMapping("/session/{sessionId}")
    public ResponseEntity<MeteorRecord> addRecord(
            @PathVariable Long sessionId,
            @Valid @RequestBody MeteorRecordRequest request) {
        MeteorRecord record = recordService.addRecord(sessionId, request);
        return ResponseEntity.ok(record);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeteorRecord> getRecord(@PathVariable Long id) {
        return recordService.getRecord(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<MeteorRecord>> getRecordsBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(recordService.getRecordsBySession(sessionId));
    }

    @GetMapping("/session/{sessionId}/count")
    public ResponseEntity<Long> getRecordCount(@PathVariable Long sessionId) {
        return ResponseEntity.ok(recordService.countBySession(sessionId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRecord(@PathVariable Long id) {
        recordService.deleteRecord(id);
        return ResponseEntity.noContent().build();
    }
}
