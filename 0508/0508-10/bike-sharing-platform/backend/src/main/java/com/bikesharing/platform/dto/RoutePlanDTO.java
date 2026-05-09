package com.bikesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoutePlanDTO {
    private String planId;
    private List<RouteStepDTO> steps;
    private Double totalDistanceKm;
    private Integer totalDurationMinutes;
    private Integer totalBikesMoved;
    private Integer vehiclesUsed;
    private List<double[]> routeCoordinates;
    private Long startTime;
    private String status;
}
