package com.prison.call.controller;

import com.prison.call.entity.CallRecord;
import com.prison.call.service.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/calls")
@CrossOrigin(origins = "*")
public class CallController {
    
    @Autowired
    private CallService callService;
    
    @GetMapping("/quota/{inmateId}")
    public ResponseEntity<Map<String, Object>> checkQuota(@PathVariable Long inmateId) {
        return ResponseEntity.ok(callService.checkQuota(inmateId));
    }
    
    @PostMapping("/start")
    public ResponseEntity<CallRecord> startCall(@RequestBody Map<String, Object> request) {
        Long inmateId = Long.valueOf(request.get("inmateId").toString());
        String calledNumber = (String) request.getOrDefault("calledNumber", "");
        String calledPerson = (String) request.getOrDefault("calledPerson", "");
        return ResponseEntity.ok(callService.startCall(inmateId, calledNumber, calledPerson));
    }
    
    @PostMapping("/end/{callId}")
    public ResponseEntity<CallRecord> endCall(@PathVariable Long callId, @RequestBody Map<String, Object> request) {
        String transcription = (String) request.getOrDefault("transcription", "");
        return ResponseEntity.ok(callService.endCall(callId, transcription));
    }
    
    @GetMapping
    public ResponseEntity<List<CallRecord>> getAllCallRecords() {
        return ResponseEntity.ok(callService.getAllCallRecords());
    }
    
    @GetMapping("/inmate/{inmateId}")
    public ResponseEntity<List<CallRecord>> getCallRecordsByInmate(@PathVariable Long inmateId) {
        return ResponseEntity.ok(callService.getCallRecordsByInmate(inmateId));
    }
    
    @GetMapping("/sensitive")
    public ResponseEntity<List<CallRecord>> getSensitiveCallRecords() {
        return ResponseEntity.ok(callService.getSensitiveCallRecords());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CallRecord> getCallRecordById(@PathVariable Long id) {
        return callService.getCallRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
