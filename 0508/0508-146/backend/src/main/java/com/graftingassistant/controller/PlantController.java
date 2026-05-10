package com.graftingassistant.controller;

import com.graftingassistant.entity.Plant;
import com.graftingassistant.service.PlantService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/plants")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PlantController {
    
    private final PlantService plantService;
    
    @GetMapping("/rootstocks")
    public ResponseEntity<List<Plant>> getRootstocks() {
        return ResponseEntity.ok(plantService.getAllRootstocks());
    }
    
    @GetMapping("/scions")
    public ResponseEntity<List<Plant>> getScions() {
        return ResponseEntity.ok(plantService.getAllScions());
    }
}
