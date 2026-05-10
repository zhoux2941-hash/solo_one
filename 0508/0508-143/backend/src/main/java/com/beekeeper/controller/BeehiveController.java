package com.beekeeper.controller;

import com.beekeeper.dto.BeehiveDTO;
import com.beekeeper.entity.Beehive;
import com.beekeeper.service.BeehiveService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beehives")
@RequiredArgsConstructor
public class BeehiveController {
    
    private final BeehiveService beehiveService;
    
    @GetMapping
    public ResponseEntity<List<Beehive>> getAllBeehives() {
        return ResponseEntity.ok(beehiveService.getAllBeehives());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Beehive> getBeehive(@PathVariable Long id) {
        return ResponseEntity.ok(beehiveService.getBeehive(id));
    }
    
    @PostMapping
    public ResponseEntity<Beehive> createBeehive(@Valid @RequestBody BeehiveDTO dto) {
        return ResponseEntity.ok(beehiveService.createBeehive(dto));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Beehive> updateBeehive(@PathVariable Long id, @Valid @RequestBody BeehiveDTO dto) {
        return ResponseEntity.ok(beehiveService.updateBeehive(id, dto));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBeehive(@PathVariable Long id) {
        beehiveService.deleteBeehive(id);
        return ResponseEntity.ok().build();
    }
}
