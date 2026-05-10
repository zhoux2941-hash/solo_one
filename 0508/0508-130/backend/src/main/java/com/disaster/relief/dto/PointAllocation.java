package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class PointAllocation {
    private String pointId;
    private String pointName;
    private Double distance;
    private SupplyRequirement allocated;
    private SupplyRequirement requested;
    private Double satisfactionRate;
}
