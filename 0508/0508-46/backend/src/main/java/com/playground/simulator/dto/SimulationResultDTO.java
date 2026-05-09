package com.playground.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResultDTO {
    private String simulationId;
    private List<ChildResultDTO> childResults;
    private List<TimelineEventDTO> timeline;
    private int totalTime;
}
