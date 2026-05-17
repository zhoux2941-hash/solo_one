package com.zoo.monitoring.controller;

import com.zoo.monitoring.entity.Bird;
import com.zoo.monitoring.service.BirdService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/birds")
@CrossOrigin(origins = "*")
public class BirdController {
    @Autowired
    private BirdService birdService;

    @GetMapping
    public List<Bird> getAllBirds() {
        return birdService.findAll();
    }

    @GetMapping("/page")
    public Map<String, Object> getBirdsPage(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Bird> birdPage = birdService.findAll(pageable);
        
        Map<String, Object> response = new HashMap<>();
        response.put("content", birdPage.getContent());
        response.put("totalElements", birdPage.getTotalElements());
        response.put("totalPages", birdPage.getTotalPages());
        response.put("currentPage", birdPage.getNumber());
        response.put("pageSize", birdPage.getSize());
        return response;
    }

    @GetMapping("/{id}")
    public ResponseEntity<Bird> getBirdById(@PathVariable Long id) {
        return birdService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/no/{birdNo}")
    public ResponseEntity<Bird> getBirdByNo(@PathVariable String birdNo) {
        return birdService.findByBirdNo(birdNo)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/species")
    public List<String> getAllSpecies() {
        return birdService.getAllSpecies();
    }

    @GetMapping("/quarantined")
    public List<Bird> getQuarantinedBirds() {
        return birdService.findQuarantinedBirds();
    }

    @PostMapping
    public Bird createBird(@Valid @RequestBody Bird bird) {
        return birdService.save(bird);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Bird> updateBird(@PathVariable Long id, @Valid @RequestBody Bird birdDetails) {
        return birdService.findById(id)
                .map(bird -> {
                    bird.setBirdNo(birdDetails.getBirdNo());
                    bird.setSpecies(birdDetails.getSpecies());
                    bird.setCageNo(birdDetails.getCageNo());
                    bird.setVaccineDate(birdDetails.getVaccineDate());
                    bird.setAntibodyTiter(birdDetails.getAntibodyTiter());
                    return ResponseEntity.ok(birdService.save(bird));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/quarantine")
    public ResponseEntity<Bird> setQuarantine(@PathVariable Long id, @RequestParam Boolean quarantine) {
        try {
            Bird bird = birdService.setQuarantine(id, quarantine);
            return ResponseEntity.ok(bird);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteBird(@PathVariable Long id) {
        return birdService.findById(id)
                .map(bird -> {
                    birdService.delete(id);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
