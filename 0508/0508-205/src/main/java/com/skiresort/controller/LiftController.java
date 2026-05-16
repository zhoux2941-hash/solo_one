package com.skiresort.controller;

import com.skiresort.model.Lift;
import com.skiresort.service.LiftService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/lifts")
@CrossOrigin(origins = "*")
public class LiftController {

    @Autowired
    private LiftService liftService;

    @GetMapping
    public List<Lift> getAllLifts() {
        return liftService.getAllLifts();
    }

    @GetMapping("/active")
    public List<Lift> getActiveLifts() {
        return liftService.getActiveLifts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Lift> getLiftById(@PathVariable Long id) {
        return liftService.getLiftById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Lift createLift(@RequestBody Lift lift) {
        return liftService.createLift(lift);
    }

    @PutMapping("/{id}/queue")
    public ResponseEntity<Lift> updateLiftQueue(
            @PathVariable Long id,
            @RequestParam Integer queueSize,
            @RequestParam(required = false, defaultValue = "system") String recordedBy) {
        return ResponseEntity.ok(liftService.updateLiftQueue(id, queueSize, recordedBy));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Lift> updateLift(@PathVariable Long id, @RequestBody Lift lift) {
        lift.setId(id);
        return ResponseEntity.ok(liftService.updateLift(lift));
    }

    @PostMapping("/{id}/toggle")
    public ResponseEntity<Lift> toggleLiftStatus(@PathVariable Long id) {
        return ResponseEntity.ok(liftService.toggleLiftStatus(id));
    }

    @GetMapping("/type/{type}")
    public List<Lift> getLiftsByType(@PathVariable Lift.LiftType type) {
        return liftService.getLiftsByType(type);
    }
}
