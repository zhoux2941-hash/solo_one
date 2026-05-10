package com.company.watermonitor.repository;

import com.company.watermonitor.entity.WarehouseInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WarehouseInventoryRepository extends JpaRepository<WarehouseInventory, Long> {
    
    Optional<WarehouseInventory> findByFloor(Integer floor);
    
    List<WarehouseInventory> findAllByOrderByFloorAsc();
    
    List<WarehouseInventory> findByCurrentStockLessThanOrderByFloorAsc(Integer minStock);
}
