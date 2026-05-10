package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PathSegmentDTO {
    private Integer fromRow;
    private Integer fromCol;
    private Integer toRow;
    private Integer toCol;
    private Double distance;
    private String description;
}