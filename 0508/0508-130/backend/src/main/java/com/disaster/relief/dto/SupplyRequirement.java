package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupplyRequirement {
    private Integer tentQuantity;
    private Integer waterQuantity;
    private Integer foodQuantity;
    private Integer medicalKitQuantity;
}
