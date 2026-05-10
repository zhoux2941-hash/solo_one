package com.cinema.popcorn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationResponse {
    private List<MachineSchedule> schedules;
    private List<QueueDataPoint> queueCurve;
    private String recommendation;
    private Integer totalMachinesUsed;
    private Double avgWaitingTime;
    private CostComparison costComparison;
}
