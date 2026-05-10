package com.disaster.relief.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class AllocationResult {
    private String algorithm;
    private Double totalCost;
    private Double satisfactionRate;
    private List<PointAllocation> allocations;
    private SupplyRequirement unmetRequirements;
    private Map<String, Object> metrics;
}
