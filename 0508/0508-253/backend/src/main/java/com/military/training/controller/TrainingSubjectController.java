package com.military.training.controller;

import com.military.training.entity.TrainingSubject;
import com.military.training.service.TrainingSubjectService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class TrainingSubjectController {

    @Autowired
    private TrainingSubjectService service;

    @GetMapping
    public List<TrainingSubject> findAll() {
        return service.findAll();
    }

    @GetMapping("/category/{category}")
    public List<TrainingSubject> findByCategory(@PathVariable String category) {
        return service.findByCategory(category);
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingSubject> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public TrainingSubject save(@RequestBody TrainingSubject subject) {
        return service.save(subject);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingSubject> update(@PathVariable Long id, @RequestBody TrainingSubject subject) {
        return service.findById(id)
                .map(existing -> {
                    subject.setId(id);
                    return ResponseEntity.ok(service.save(subject));
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