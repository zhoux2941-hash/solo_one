package com.company.watermonitor.controller;

import com.company.watermonitor.dto.InventoryDTO;
import com.company.watermonitor.service.InventoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
@RequiredArgsConstructor
public class InventoryController {

    private final InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<InventoryDTO>> getAllInventories() {
        return ResponseEntity.ok(inventoryService.getAllInventories());
    }

    @GetMapping("/{floor}")
    public ResponseEntity<InventoryDTO> getInventoryByFloor(@PathVariable Integer floor) {
        InventoryDTO dto = inventoryService.getInventoryByFloor(floor);
        if (dto == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(dto);
    }

    @PostMapping
    public ResponseEntity<InventoryDTO> saveOrUpdate(@RequestBody InventoryDTO dto) {
        return ResponseEntity.ok(inventoryService.saveOrUpdateInventory(dto));
    }

    @PostMapping("/{floor}/update")
    public ResponseEntity<InventoryDTO> updateStock(
            @PathVariable Integer floor,
            @RequestBody Map<String, Object> request) {
        Integer quantity = (Integer) request.get("quantity");
        String operation = (String) request.get("operation");
        
        if (quantity == null || operation == null) {
            return ResponseEntity.badRequest().build();
        }
        
        InventoryDTO result = inventoryService.updateStock(floor, quantity, operation);
        if (result == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{floor}/restock")
    public ResponseEntity<Boolean> restock(
            @PathVariable Integer floor,
            @RequestBody Map<String, Object> request) {
        Integer quantity = (Integer) request.get("quantity");
        if (quantity == null) {
            quantity = 5;
        }
        
        boolean success = inventoryService.restockFloor(floor, quantity);
        return ResponseEntity.ok(success);
    }

    @PostMapping("/initialize")
    public ResponseEntity<Void> initialize() {
        inventoryService.initializeDefaultInventories();
        return ResponseEntity.ok().build();
    }
}
