package com.company.watermonitor.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class DeliveryOrderDTO {
    
    private Long orderId;
    private Long machineId;
    private Integer floor;
    private String location;
    private LocalDateTime orderTime;
    private LocalDateTime deliveredTime;
    private String status;
    private Double remainingLiters;
    private Long responseTimeMinutes;
    private Integer machineCount;
    private List<Long> machineIds;
    private List<String> machineLocations;
    private List<Double> remainingLitersList;
}
