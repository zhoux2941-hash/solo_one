package com.bikesharing.platform.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PredictionDTO {
    private Long pointId;
    private String pointName;
    private LocalDateTime predictionTime;
    private Integer predictedBorrowDemand;
    private Integer predictedReturnDemand;
    private Double confidence;
}
