package com.logistics.track.dto;

import lombok.Data;

@Data
public class RouteStatisticsDTO {
    private String fromCity;
    private String toCity;
    private String routeKey;
    
    private Long totalPackages;
    private Double meanDurationHours;
    private Double standardDeviation;
    private Double threshold;
    
    private Double minDuration;
    private Double maxDuration;
    private Long anomalyCount;
}
