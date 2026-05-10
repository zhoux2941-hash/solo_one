package com.biolab.pipette.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VolumeAccumulationDTO {

    private String reagentType;

    private String reagentTypeName;

    private Double totalVolumeUl;

    private Integer pipetteCount;

    private Double accumulatedError;

    private Double errorPercentage;

    private String warningLevel;

    private String warningMessage;
}