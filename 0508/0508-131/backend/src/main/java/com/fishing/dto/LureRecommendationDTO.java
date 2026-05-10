package com.fishing.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class LureRecommendationDTO {
    private Long lureId;
    private String brand;
    private String model;
    private String color;
    private String type;
    private BigDecimal weight;
    private Long catchCount;
    private Long usageCount;
    private Double successRate;
    private Long releaseCount;
    private Double ecoScore;
    private String ecoBadge;
}
