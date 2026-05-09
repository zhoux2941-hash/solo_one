package com.logistics.track.dto;

import lombok.Data;

import java.util.List;

@Data
public class AnomalyDetectionResultDTO {
    private Integer totalPackages;
    private Integer anomalyCount;
    private Double anomalyRate;
    private List<AnomalyPackageDTO> anomalies;
    private List<RouteStatisticsDTO> routeStatistics;
    private String analyzedAt;
}
