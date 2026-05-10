package com.petclean.controller;

import com.petclean.entity.Building;
import com.petclean.service.BuildingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/buildings")
@RequiredArgsConstructor
public class BuildingController {

    private final BuildingService buildingService;

    @GetMapping
    public ResponseEntity<List<Building>> getAllBuildings() {
        return ResponseEntity.ok(buildingService.getAllBuildings());
    }

    @GetMapping("/ranked")
    public ResponseEntity<List<Building>> getBuildingsRanked() {
        return ResponseEntity.ok(buildingService.getBuildingsRanked());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Building> getBuildingById(@PathVariable Long id) {
        Optional<Building> building = buildingService.getBuildingById(id);
        return building.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/points")
    public ResponseEntity<Integer> getBuildingPoints(@PathVariable Long id) {
        Integer points = buildingService.getBuildingPoints(id);
        return ResponseEntity.ok(points);
    }
}
