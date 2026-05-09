package com.playground.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationParamsDTO {
    private List<ChildDTO> children;
    private int patienceCoefficient;
    private int slideUsageTime;
    private int totalSimulationTime;
}
