package com.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DispatchRecommendationDTO {

    private String riderId;
    private String riderName;
    private Double score;
    private Double distanceToMerchant;
    private Integer currentOrders;
    private Double onTimeRate;
    private Double distanceScore;
    private Double loadScore;
    private Double onTimeScore;
    private String recommendationReason;
}
