package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WellPositionDTO {
    private Long id;
    private Long tubeRackId;
    private Integer rowNum;
    private Integer colNum;
    private String reagentType;
    private String reagentTypeName;
    private String label;
    private String notes;
}