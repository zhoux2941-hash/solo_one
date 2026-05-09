package com.playground.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MonteCarloResultDTO {
    private int simulationCount;
    private double averageLeaveRate;
    private double averageWaitTime;
    private Map<String, List<Integer>> childWaitTimes;
    private List<SimulationResultDTO> individualResults;
}
