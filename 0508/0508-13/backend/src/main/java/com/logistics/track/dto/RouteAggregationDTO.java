package com.logistics.track.dto;

import lombok.Data;

import java.util.List;

@Data
public class RouteAggregationDTO {
    private String fromCity;
    private String toCity;
    private String routeKey;
    private Long totalPackages;
    
    private Double fromLatitude;
    private Double fromLongitude;
    private Double toLatitude;
    private Double toLongitude;
    
    private Double avgDistance;
    private Double avgDurationHours;
    
    private List<Long> samplePackageIds;
    private TrackSummaryDTO representativePackage;
}
