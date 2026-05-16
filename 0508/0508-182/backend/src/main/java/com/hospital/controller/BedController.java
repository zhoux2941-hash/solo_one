package com.hospital.controller;

import com.hospital.entity.Bed;
import com.hospital.service.BedService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/beds")
@CrossOrigin(origins = "http://localhost:5173")
public class BedController {
    @Autowired
    private BedService bedService;

    @GetMapping
    public List<Bed> getAllBeds() {
        return bedService.getAllBeds();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bed> getBedById(@PathVariable Long id) {
        return bedService.getBedById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Bed createBed(@RequestBody Bed bed) {
        return bedService.createBed(bed);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bed> updateBed(@PathVariable Long id, @RequestBody Bed bedDetails) {
        try {
            return ResponseEntity.ok(bedService.updateBed(id, bedDetails));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<Bed> assignPatient(@PathVariable Long id, @RequestBody Map<String, String> patientInfo) {
        try {
            return ResponseEntity.ok(bedService.assignPatient(id, 
                patientInfo.get("patientName"), 
                patientInfo.get("patientId")));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}/release")
    public ResponseEntity<Bed> releaseBed(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bedService.releaseBed(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBed(@PathVariable Long id) {
        bedService.deleteBed(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/stats/icu-occupied")
    public long getOccupiedIcuBedCount() {
        return bedService.getOccupiedIcuBedCount();
    }
}
