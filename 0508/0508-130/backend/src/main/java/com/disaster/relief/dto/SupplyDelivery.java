package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SupplyDelivery {
    private Integer day;
    private SupplyRequirement supplies;
    private String source;
}
