package com.flower.preservative.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResultDTO {
    private String formulaCode;
    private String formulaName;
    private Integer experimentDays;
    private Double witheringPercentage;
    private String status;
}
