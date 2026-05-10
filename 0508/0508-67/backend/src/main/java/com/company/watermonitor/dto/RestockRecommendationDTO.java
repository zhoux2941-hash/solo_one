package com.company.watermonitor.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class RestockRecommendationDTO {
    
    private Long recommendationId;
    private Integer floor;
    private Integer currentStock;
    private Integer minStock;
    private Integer maxStock;
    private Integer predictedConsumption2H;
    private Integer stockAfter2H;
    private Integer recommendedQuantity;
    private String urgencyLevel;
    private String status;
    private LocalDateTime generatedTime;
    private LocalDateTime estimatedDepletionTime;
    private String message;
}
