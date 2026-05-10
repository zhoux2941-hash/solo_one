package com.disaster.relief.dto;

import lombok.Data;
import java.util.List;

@Data
public class AllocationRequest {
    private String algorithm = "GREEDY";
    private List<ReliefPoint> reliefPoints;
    private SupplyRequirement totalRequirement;
}
