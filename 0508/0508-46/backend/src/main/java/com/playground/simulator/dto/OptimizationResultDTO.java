package com.playground.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OptimizationResultDTO {
    private boolean foundOptimal;
    private int recommendedSlideTime;
    private double expectedLeaveRate;
    private double expectedAverageWaitTime;
    private String recommendation;
    private int currentSlideTime;
}
