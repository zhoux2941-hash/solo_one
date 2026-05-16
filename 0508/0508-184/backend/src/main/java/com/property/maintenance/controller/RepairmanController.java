package com.property.maintenance.controller;

import com.property.maintenance.entity.Repairman;
import com.property.maintenance.repository.RepairmanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/repairmen")
@CrossOrigin(origins = "*")
public class RepairmanController {

    @Autowired
    private RepairmanRepository repairmanRepository;

    @GetMapping
    public ResponseEntity<List<Repairman>> getAllRepairmen() {
        return ResponseEntity.ok(repairmanRepository.findByStatus(1));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Repairman> getRepairmanById(@PathVariable Long id) {
        return repairmanRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Repairman> createRepairman(@RequestBody Repairman repairman) {
        repairman.setStatus(1);
        return ResponseEntity.ok(repairmanRepository.save(repairman));
    }
}
