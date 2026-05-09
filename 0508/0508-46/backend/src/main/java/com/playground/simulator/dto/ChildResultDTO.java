package com.playground.simulator.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChildResultDTO {
    private String name;
    private int age;
    private boolean leftEarly;
    private int playsCount;
    private int totalWaitTime;
}
