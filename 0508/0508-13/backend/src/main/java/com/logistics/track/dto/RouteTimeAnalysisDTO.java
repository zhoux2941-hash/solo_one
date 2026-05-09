package com.logistics.track.dto;

import lombok.Data;

@Data
public class RouteTimeAnalysisDTO {
    private String fromCity;
    private String toCity;
    private String route;
    private Long totalPackages;
    private Double averageDurationHours;
    private Long minDurationHours;
    private Long maxDurationHours;
}
