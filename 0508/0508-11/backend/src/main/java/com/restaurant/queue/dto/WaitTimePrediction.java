package com.restaurant.queue.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaitTimePrediction {

    private Integer estimatedWaitMinutes;
    private Integer currentQueueLength;
    private Integer availableTables;
    private Double averageMealDuration;
}
