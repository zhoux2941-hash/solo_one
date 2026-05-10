package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TipChangeDTO {

    private Integer taskIndex;

    private Integer taskOrder;

    private String reason;

    private String recommendation;

    private Integer tipGroupId;

    private String sourceWellLabel;

    private String targetWellLabel;

    private String sourceReagentType;

    private String targetReagentType;
}