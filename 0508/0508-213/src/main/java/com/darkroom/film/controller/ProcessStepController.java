package com.darkroom.film.controller;

import com.darkroom.film.entity.ProcessStep;
import com.darkroom.film.service.ProcessStepService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/process-steps")
@CrossOrigin(origins = "*")
public class ProcessStepController {
    @Autowired
    private ProcessStepService processStepService;

    @GetMapping
    public List<ProcessStep> getAllProcessSteps() {
        return processStepService.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProcessStep> getProcessStepById(@PathVariable Long id) {
        return processStepService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/film/{filmId}")
    public List<ProcessStep> getProcessStepsByFilmId(@PathVariable Long filmId) {
        return processStepService.findByFilmId(filmId);
    }

    @PostMapping
    public ProcessStep createProcessStep(@RequestBody ProcessStep processStep) {
        return processStepService.save(processStep);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProcessStep> updateProcessStep(@PathVariable Long id, @RequestBody ProcessStep processStep) {
        return processStepService.findById(id)
                .map(existing -> {
                    processStep.setId(id);
                    return ResponseEntity.ok(processStepService.save(processStep));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProcessStep(@PathVariable Long id) {
        return processStepService.findById(id)
                .map(step -> {
                    processStepService.deleteById(id);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}