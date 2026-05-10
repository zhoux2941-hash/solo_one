package com.battery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatteryResult {
    private String batteryId;
    private Integer initialBattery;
    private Integer remainingBattery;
    private Double dischargeRate;
    private Double differentialCoefficient;
}