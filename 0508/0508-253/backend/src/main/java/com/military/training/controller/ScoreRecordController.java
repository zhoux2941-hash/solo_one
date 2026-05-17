package com.military.training.controller;

import com.military.training.entity.ScoreRecord;
import com.military.training.service.ScoreRecordService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/scores")
public class ScoreRecordController {

    @Autowired
    private ScoreRecordService service;

    @GetMapping
    public List<ScoreRecord> findAll() {
        return service.findAll();
    }

    @GetMapping("/trainee/{traineeId}")
    public List<ScoreRecord> findByTraineeId(@PathVariable Long traineeId) {
        return service.findByTraineeId(traineeId);
    }

    @GetMapping("/subject/{subjectId}")
    public List<ScoreRecord> findBySubjectId(@PathVariable Long subjectId) {
        return service.findBySubjectId(subjectId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ScoreRecord> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ScoreRecord save(@RequestBody ScoreRecord record) {
        return service.save(record);
    }

    @PostMapping("/batch")
    public List<ScoreRecord> batchSave(@RequestBody List<ScoreRecord> records) {
        return service.batchSave(records);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ScoreRecord> update(@PathVariable Long id, @RequestBody ScoreRecord record) {
        return service.findById(id)
                .map(existing -> {
                    record.setId(id);
                    return ResponseEntity.ok(service.save(record));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (service.findById(id).isPresent()) {
            service.delete(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}