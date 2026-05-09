package com.delivery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiderLocationDTO {

    private String riderId;
    private String riderName;
    private String orderId;
    private Double lng;
    private Double lat;
    private Long remainingMinutes;
    private String riskLevel;
    private Double distanceToMerchant;
    private Long estimatedTime;
}
