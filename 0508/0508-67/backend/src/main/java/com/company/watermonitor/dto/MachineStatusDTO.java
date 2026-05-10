package com.company.watermonitor.dto;

import lombok.Data;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
public class MachineStatusDTO implements Serializable {
    
    private Long machineId;
    private Integer floor;
    private String location;
    private Double remainingLiters;
    private Double maxCapacity;
    private Boolean isLowWater;
    private LocalDateTime lastReportTime;
    private Double consumptionRate;
    private LocalDateTime estimatedLowWaterTime;
}
