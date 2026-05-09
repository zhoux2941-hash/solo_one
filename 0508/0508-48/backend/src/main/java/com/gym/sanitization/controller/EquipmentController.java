package com.gym.sanitization.controller;

import com.gym.sanitization.entity.Equipment;
import com.gym.sanitization.service.EquipmentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private static final Logger logger = LoggerFactory.getLogger(EquipmentController.class);

    @Autowired
    private EquipmentService equipmentService;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllEquipments() {
        logger.info("Getting all equipments");
        List<Equipment> equipments = equipmentService.getAllEquipments();
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", equipments,
            "count", equipments.size()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getEquipmentById(@PathVariable Long id) {
        logger.info("Getting equipment with ID: {}", id);
        return equipmentService.getEquipmentById(id)
            .map(equipment -> ResponseEntity.ok(Map.of(
                "success", true,
                "data", equipment
            )))
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Map<String, Object>> getEquipmentsByCategory(@PathVariable String category) {
        logger.info("Getting equipments by category: {}", category);
        List<Equipment> equipments = equipmentService.getEquipmentsByCategory(category);
        return ResponseEntity.ok(Map.of(
            "success", true,
            "data", equipments,
            "count", equipments.size()
        ));
    }
}
