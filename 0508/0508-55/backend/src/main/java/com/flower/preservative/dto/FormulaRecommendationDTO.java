package com.flower.preservative.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FormulaRecommendationDTO {
    private String formulaCode;
    private String formulaName;
    private Integer freshDays;
    private Integer cost;
    private Integer easeOfUse;
    private Integer lifespanExtensionDays;
    private Boolean isRecommended;
}
