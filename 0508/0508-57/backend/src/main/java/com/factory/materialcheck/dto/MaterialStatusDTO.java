package com.factory.materialcheck.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MaterialStatusDTO {
    private String materialCode;
    private String materialName;
    private Integer currentStock;
    private Integer requiredQuantity;
    private Integer shortage;
    private boolean isSufficient;
    private String unit;
}
