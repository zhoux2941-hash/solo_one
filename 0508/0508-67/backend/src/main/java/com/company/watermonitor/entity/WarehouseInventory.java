package com.company.watermonitor.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "warehouse_inventory")
public class WarehouseInventory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "inventory_id")
    private Long inventoryId;
    
    @Column(name = "floor", nullable = false, unique = true)
    private Integer floor;
    
    @Column(name = "current_stock", nullable = false)
    private Integer currentStock;
    
    @Column(name = "min_stock", nullable = false)
    private Integer minStock;
    
    @Column(name = "max_stock", nullable = false)
    private Integer maxStock;
    
    @Column(name = "last_restock_time")
    private LocalDateTime lastRestockTime;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
