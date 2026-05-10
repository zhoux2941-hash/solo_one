package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipetteTaskDTO {
    private Long id;
    private Long experimentId;
    private Long sourceWellId;
    private Long targetWellId;
    private Double volumeUl;
    private Integer taskOrder;
    private String notes;
    
    private String sourceWellLabel;
    private String targetWellLabel;
    private Integer sourceRow;
    private Integer sourceCol;
    private Integer targetRow;
    private Integer targetCol;
    private Double segmentDistance;
}