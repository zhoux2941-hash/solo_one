package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PathOptimizationResultDTO {
    private List<PipetteTaskDTO> optimizedOrder;
    private List<Integer> orderIndices;
    private Double totalDistance;
    private Double originalDistance;
    private Double improvementPercentage;
    private String algorithmUsed;
    private Long executionTimeMs;
    private List<PathSegmentDTO> segments;

    private List<VolumeAccumulationDTO> volumeAccumulations;
    private List<TipChangeDTO> tipChanges;
    private Integer estimatedTipCount;
    private Double totalAccumulatedError;
    private String overallWarningMessage;
}