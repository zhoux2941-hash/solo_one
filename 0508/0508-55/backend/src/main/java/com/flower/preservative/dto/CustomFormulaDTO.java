package com.flower.preservative.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomFormulaDTO {
    private Long id;
    private String formulaCode;
    private String formulaName;
    private Double sugarRatio;
    private Double bleachRatio;
    private Double citricAcidRatio;
    private String otherIngredients;
    private Integer freshDays;
    private Integer cost;
    private Integer easeOfUse;
    private String description;
}
