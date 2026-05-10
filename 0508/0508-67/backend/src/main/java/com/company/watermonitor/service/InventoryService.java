package com.company.watermonitor.service;

import com.company.watermonitor.dto.InventoryDTO;
import com.company.watermonitor.entity.WarehouseInventory;
import com.company.watermonitor.repository.WarehouseInventoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final WarehouseInventoryRepository inventoryRepository;

    public List<InventoryDTO> getAllInventories() {
        return inventoryRepository.findAllByOrderByFloorAsc()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public InventoryDTO getInventoryByFloor(Integer floor) {
        return inventoryRepository.findByFloor(floor)
                .map(this::toDTO)
                .orElse(null);
    }

    public InventoryDTO saveOrUpdateInventory(InventoryDTO dto) {
        Optional<WarehouseInventory> existing = inventoryRepository.findByFloor(dto.getFloor());
        
        WarehouseInventory inventory;
        if (existing.isPresent()) {
            inventory = existing.get();
            inventory.setCurrentStock(dto.getCurrentStock());
            inventory.setMinStock(dto.getMinStock());
            inventory.setMaxStock(dto.getMaxStock());
        } else {
            inventory = new WarehouseInventory();
            inventory.setFloor(dto.getFloor());
            inventory.setCurrentStock(dto.getCurrentStock() != null ? dto.getCurrentStock() : 0);
            inventory.setMinStock(dto.getMinStock() != null ? dto.getMinStock() : 5);
            inventory.setMaxStock(dto.getMaxStock() != null ? dto.getMaxStock() : 20);
            inventory.setLastRestockTime(LocalDateTime.now());
        }
        
        WarehouseInventory saved = inventoryRepository.save(inventory);
        log.info("[库存管理] {}楼库存已更新 - 当前:{}桶, 最小:{}, 最大:{}", 
                saved.getFloor(), saved.getCurrentStock(), saved.getMinStock(), saved.getMaxStock());
        
        return toDTO(saved);
    }

    public InventoryDTO updateStock(Integer floor, Integer quantity, String operation) {
        Optional<WarehouseInventory> optional = inventoryRepository.findByFloor(floor);
        if (optional.isEmpty()) {
            return null;
        }
        
        WarehouseInventory inventory = optional.get();
        int current = inventory.getCurrentStock();
        
        switch (operation.toUpperCase()) {
            case "ADD" -> inventory.setCurrentStock(current + quantity);
            case "SUBTRACT" -> inventory.setCurrentStock(Math.max(0, current - quantity));
            case "SET" -> inventory.setCurrentStock(Math.max(0, quantity));
            default -> {
                log.warn("[库存管理] 未知操作: {}", operation);
                return toDTO(inventory);
            }
        }
        
        if ("ADD".equals(operation.toUpperCase())) {
            inventory.setLastRestockTime(LocalDateTime.now());
        }
        
        WarehouseInventory saved = inventoryRepository.save(inventory);
        log.info("[库存管理] {}楼库存变更 - 操作:{}, 数量:{}, 变更后:{}", 
                floor, operation, quantity, saved.getCurrentStock());
        
        return toDTO(saved);
    }

    public boolean restockFloor(Integer floor, Integer quantity) {
        Optional<WarehouseInventory> optional = inventoryRepository.findByFloor(floor);
        if (optional.isEmpty()) {
            return false;
        }
        
        WarehouseInventory inventory = optional.get();
        int newStock = Math.min(inventory.getCurrentStock() + quantity, inventory.getMaxStock());
        inventory.setCurrentStock(newStock);
        inventory.setLastRestockTime(LocalDateTime.now());
        
        inventoryRepository.save(inventory);
        log.info("[库存管理] {}楼已补货 {} 桶，当前库存: {} 桶", floor, quantity, newStock);
        return true;
    }

    public InventoryDTO createInventory(Integer floor, Integer currentStock, Integer minStock, Integer maxStock) {
        WarehouseInventory inventory = new WarehouseInventory();
        inventory.setFloor(floor);
        inventory.setCurrentStock(currentStock != null ? currentStock : 0);
        inventory.setMinStock(minStock != null ? minStock : 5);
        inventory.setMaxStock(maxStock != null ? maxStock : 20);
        inventory.setLastRestockTime(LocalDateTime.now());
        
        WarehouseInventory saved = inventoryRepository.save(inventory);
        log.info("[库存管理] 创建 {} 楼库存记录", floor);
        return toDTO(saved);
    }

    public void initializeDefaultInventories() {
        List<Integer> floors = List.of(1, 2, 3, 4);
        
        for (Integer floor : floors) {
            if (inventoryRepository.findByFloor(floor).isEmpty()) {
                WarehouseInventory inventory = new WarehouseInventory();
                inventory.setFloor(floor);
                inventory.setCurrentStock(10);
                inventory.setMinStock(5);
                inventory.setMaxStock(20);
                inventory.setLastRestockTime(LocalDateTime.now());
                inventoryRepository.save(inventory);
                log.info("[库存管理] 初始化 {} 楼默认库存", floor);
            }
        }
    }

    private InventoryDTO toDTO(WarehouseInventory inventory) {
        InventoryDTO dto = new InventoryDTO();
        dto.setInventoryId(inventory.getInventoryId());
        dto.setFloor(inventory.getFloor());
        dto.setCurrentStock(inventory.getCurrentStock());
        dto.setMinStock(inventory.getMinStock());
        dto.setMaxStock(inventory.getMaxStock());
        dto.setLastRestockTime(inventory.getLastRestockTime());
        dto.setUpdatedAt(inventory.getUpdatedAt());
        return dto;
    }
}
