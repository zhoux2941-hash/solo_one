package com.skiresort.controller;

import com.skiresort.model.Slope;
import com.skiresort.service.SlopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/slopes")
@CrossOrigin(origins = "*")
public class SlopeController {

    @Autowired
    private SlopeService slopeService;

    @GetMapping
    public List<Slope> getAllSlopes() {
        return slopeService.getAllSlopes();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Slope> getSlopeById(@PathVariable Long id) {
        return slopeService.getSlopeById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Slope createSlope(@RequestBody Slope slope) {
        return slopeService.createSlope(slope);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Slope> updateSlopeStatus(
            @PathVariable Long id,
            @RequestParam Slope.SlopeStatus status) {
        return ResponseEntity.ok(slopeService.updateSlopeStatus(id, status));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Slope> updateSlope(@PathVariable Long id, @RequestBody Slope slope) {
        slope.setId(id);
        return ResponseEntity.ok(slopeService.updateSlope(slope));
    }

    @PostMapping("/{id}/visitors")
    public ResponseEntity<Void> incrementVisitorCount(@PathVariable Long id) {
        slopeService.incrementVisitorCount(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/status/{status}")
    public List<Slope> getSlopesByStatus(@PathVariable Slope.SlopeStatus status) {
        return slopeService.getSlopesByStatus(status);
    }

    @GetMapping("/difficulty/{difficulty}")
    public List<Slope> getSlopesByDifficulty(@PathVariable Slope.DifficultyLevel difficulty) {
        return slopeService.getSlopesByDifficulty(difficulty);
    }
}
