package com.astronomy.variablestar.controller;

import com.astronomy.variablestar.dto.StarDetailDTO;
import com.astronomy.variablestar.entity.VariableStar;
import com.astronomy.variablestar.service.VariableStarService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/stars")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class VariableStarController {

    private final VariableStarService variableStarService;

    @GetMapping
    public ResponseEntity<List<VariableStar>> getAllStars(
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String constellation) {
        
        List<VariableStar> stars;
        if (type != null && !type.isEmpty()) {
            stars = variableStarService.getStarsByType(type);
        } else if (constellation != null && !constellation.isEmpty()) {
            stars = variableStarService.getStarsByConstellation(constellation);
        } else {
            stars = variableStarService.getAllStars();
        }
        return ResponseEntity.ok(stars);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StarDetailDTO> getStarDetail(@PathVariable Long id) {
        StarDetailDTO detail = variableStarService.getStarDetail(id);
        return ResponseEntity.ok(detail);
    }

    @GetMapping("/types")
    public ResponseEntity<List<String>> getStarTypes() {
        return ResponseEntity.ok(variableStarService.getAllStarTypes());
    }

    @GetMapping("/constellations")
    public ResponseEntity<List<String>> getConstellations() {
        return ResponseEntity.ok(variableStarService.getAllConstellations());
    }
}
