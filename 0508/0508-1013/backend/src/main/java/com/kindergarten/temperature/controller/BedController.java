package com.kindergarten.temperature.controller;

import com.kindergarten.temperature.entity.Bed;
import com.kindergarten.temperature.repository.BedRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/beds")
public class BedController {

    @Autowired
    private BedRepository bedRepository;

    @GetMapping
    public ResponseEntity<List<Bed>> getAllBeds() {
        return ResponseEntity.ok(bedRepository.findAll());
    }

    @GetMapping("/{bedNo}")
    public ResponseEntity<Bed> getBedByNo(@PathVariable Integer bedNo) {
        return bedRepository.findByBedNo(bedNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Bed> createBed(@RequestBody Bed bed) {
        if (bedRepository.existsByBedNo(bed.getBedNo())) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(bedRepository.save(bed));
    }

    @PutMapping("/{bedNo}")
    public ResponseEntity<Bed> updateBed(@PathVariable Integer bedNo, @RequestBody Bed bed) {
        return bedRepository.findByBedNo(bedNo)
                .map(existingBed -> {
                    existingBed.setChildName(bed.getChildName());
                    existingBed.setAge(bed.getAge());
                    existingBed.setGender(bed.getGender());
                    return ResponseEntity.ok(bedRepository.save(existingBed));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{bedNo}")
    public ResponseEntity<Void> deleteBed(@PathVariable Integer bedNo) {
        return bedRepository.findByBedNo(bedNo)
                .map(bed -> {
                    bedRepository.delete(bed);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
