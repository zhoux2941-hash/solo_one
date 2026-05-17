package com.military.training.controller;

import com.military.training.entity.Trainee;
import com.military.training.service.TraineeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/trainees")
public class TraineeController {

    @Autowired
    private TraineeService service;

    @GetMapping
    public List<Trainee> findAll() {
        return service.findAll();
    }

    @GetMapping("/platoon/{platoon}")
    public List<Trainee> findByPlatoon(@PathVariable String platoon) {
        return service.findByPlatoon(platoon);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Trainee> findById(@PathVariable Long id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Trainee save(@RequestBody Trainee trainee) {
        return service.save(trainee);
    }

    @PostMapping("/batch")
    public java.util.Map<String, Object> batchSave(@RequestBody List<Trainee> trainees) {
        return service.batchSave(trainees);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Trainee> update(@PathVariable Long id, @RequestBody Trainee trainee) {
        return service.findById(id)
                .map(existing -> {
                    trainee.setId(id);
                    return ResponseEntity.ok(service.save(trainee));
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