package com.sales.controller;

import com.sales.entity.FollowUpRecord;
import com.sales.service.FollowUpRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/follow-up-records")
public class FollowUpRecordController {

    @Autowired
    private FollowUpRecordService followUpRecordService;

    @GetMapping
    public List<FollowUpRecord> getAllFollowUpRecords() {
        return followUpRecordService.getAllFollowUpRecords();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FollowUpRecord> getFollowUpRecordById(@PathVariable Long id) {
        return followUpRecordService.getFollowUpRecordById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/customer/{customerId}")
    public List<FollowUpRecord> getFollowUpRecordsByCustomerId(@PathVariable Long customerId) {
        return followUpRecordService.getFollowUpRecordsByCustomerId(customerId);
    }

    @GetMapping("/salesperson/{salesperson}")
    public List<FollowUpRecord> getFollowUpRecordsBySalesperson(@PathVariable String salesperson) {
        return followUpRecordService.getFollowUpRecordsBySalesperson(salesperson);
    }

    @PostMapping("/customer/{customerId}")
    public ResponseEntity<FollowUpRecord> createFollowUpRecord(@PathVariable Long customerId,
                                                               @Valid @RequestBody FollowUpRecord record) {
        try {
            FollowUpRecord createdRecord = followUpRecordService.createFollowUpRecord(customerId, record);
            return ResponseEntity.ok(createdRecord);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<FollowUpRecord> updateFollowUpRecord(@PathVariable Long id,
                                                               @Valid @RequestBody FollowUpRecord recordDetails) {
        try {
            FollowUpRecord updatedRecord = followUpRecordService.updateFollowUpRecord(id, recordDetails);
            return ResponseEntity.ok(updatedRecord);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteFollowUpRecord(@PathVariable Long id) {
        followUpRecordService.deleteFollowUpRecord(id);
        return ResponseEntity.ok().build();
    }
}