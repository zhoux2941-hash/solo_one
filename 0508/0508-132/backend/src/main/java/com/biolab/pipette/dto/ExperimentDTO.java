package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentDTO {
    private Long id;
    private String name;
    private String description;
    private Long tubeRackId;
    private String createdBy;
    private Boolean isShared;
    private String shareCode;
    private List<PipetteTaskDTO> tasks;
    private TubeRackDTO tubeRack;
    private PathOptimizationResultDTO optimizedPath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}