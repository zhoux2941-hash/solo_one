package com.mineral.identification.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MineralMatchResult {
    
    private Long id;
    
    private String name;
    
    private String nameCn;
    
    private String chemicalFormula;
    
    private String typicalLocation;
    
    private String imageUrl;
    
    private String description;
    
    private Double matchScore;
    
    private String matchPercentage;
}
