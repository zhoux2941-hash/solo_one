package com.playground.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TimelineEventDTO {
    private String childName;
    private String phase;
    private int startTime;
    private int endTime;
}
