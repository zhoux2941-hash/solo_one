package com.company.watermonitor.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class InventoryDTO {
    
    private Long inventoryId;
    private Integer floor;
    private Integer currentStock;
    private Integer minStock;
    private Integer maxStock;
    private LocalDateTime lastRestockTime;
    private LocalDateTime updatedAt;
}
