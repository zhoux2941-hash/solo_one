package com.battery.dto;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SimulationResponse {
    private String simulationId;
    private Long timestamp;
    private Integer rideTime;
    private Integer temperature;
    private List<BatteryResult> batteryResults;
}