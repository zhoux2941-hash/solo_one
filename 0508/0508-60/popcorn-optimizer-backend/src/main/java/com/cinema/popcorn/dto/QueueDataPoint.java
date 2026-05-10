package com.cinema.popcorn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QueueDataPoint {
    private String time;
    private Double queueLength;
    private Integer activeMachines;
    private Double waitingTime;
}
