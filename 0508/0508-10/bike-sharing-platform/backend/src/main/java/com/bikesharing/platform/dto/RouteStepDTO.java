package com.bikesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteStepDTO {
    private int stepIndex;
    private Long fromPointId;
    private String fromPointName;
    private Double fromLatitude;
    private Double fromLongitude;
    private Long toPointId;
    private String toPointName;
    private Double toLatitude;
    private Double toLongitude;
    private Integer bikeCount;
    private Double distanceKm;
    private Integer durationMinutes;
    private String action;
}
