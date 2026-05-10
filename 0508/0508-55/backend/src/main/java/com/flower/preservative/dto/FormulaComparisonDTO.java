package com.flower.preservative.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormulaComparisonDTO {
    private String formulaCode;
    private String formulaName;
    private Integer freshDays;
    private Integer cost;
    private Integer easeOfUse;
}
