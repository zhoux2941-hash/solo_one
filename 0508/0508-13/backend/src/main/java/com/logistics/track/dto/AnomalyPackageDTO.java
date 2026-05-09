package com.logistics.track.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
public class AnomalyPackageDTO {
    private Long packageId;
    private String packageNo;
    private String senderCity;
    private String receiverCity;
    private String currentStatus;
    private String currentStatusDescription;
    
    private LocalDateTime pickupTime;
    private LocalDateTime latestUpdateTime;
    private Long currentDurationHours;
    
    private Double meanDurationHours;
    private Double standardDeviation;
    private Double zScore;
    private Double threshold;
    
    private Boolean isAnomaly;
    private String anomalyReason;
    private List<SuspectedStuckNode> suspectedStuckNodes;
    private LocalDateTime detectedAt;
}
