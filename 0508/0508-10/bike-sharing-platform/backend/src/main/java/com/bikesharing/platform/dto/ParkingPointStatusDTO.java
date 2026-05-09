package com.bikesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParkingPointStatusDTO {
    private Long pointId;
    private String name;
    private Double latitude;
    private Double longitude;
    private Integer capacity;
    private Integer currentBikes;
    private Double utilizationRate;
    private String status;
}
