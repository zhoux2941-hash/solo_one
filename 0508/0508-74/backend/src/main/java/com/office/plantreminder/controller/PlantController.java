package com.office.plantreminder.controller;

import com.office.plantreminder.dto.UserRankingDTO;
import com.office.plantreminder.dto.WateringRequest;
import com.office.plantreminder.entity.Plant;
import com.office.plantreminder.entity.WateringLog;
import com.office.plantreminder.service.PlantService;
import com.office.plantreminder.websocket.PlantWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plants")
public class PlantController {

    @Autowired
    private PlantService plantService;

    @Autowired
    private PlantWebSocketHandler webSocketHandler;

    @GetMapping
    public ResponseEntity<List<Plant>> getAllPlants() {
        return ResponseEntity.ok(plantService.getAllPlants());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Plant> getPlantById(@PathVariable Long id) {
        return plantService.getPlantById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/overdue")
    public ResponseEntity<List<Plant>> getOverduePlants() {
        return ResponseEntity.ok(plantService.getOverduePlants());
    }

    @PostMapping("/water")
    public ResponseEntity<Map<String, Object>> waterPlant(@RequestBody WateringRequest request) {
        Plant updatedPlant = plantService.waterPlant(
                request.getPlantId(),
                request.getWateredBy(),
                request.getNotes()
        );

        webSocketHandler.broadcastPlantUpdate(updatedPlant);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("plant", updatedPlant);
        result.put("message", request.getWateredBy() + " 已完成浇水");

        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/logs")
    public ResponseEntity<List<WateringLog>> getWateringLogs(@PathVariable Long id) {
        return ResponseEntity.ok(plantService.getWateringLogs(id));
    }

    @GetMapping("/ranking")
    public ResponseEntity<List<UserRankingDTO>> getRanking(
            @RequestParam(defaultValue = "30") int days) {
        return ResponseEntity.ok(plantService.getUserRanking(days));
    }
}
