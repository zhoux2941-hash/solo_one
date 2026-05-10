package com.battery.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DailyBatteryData {
    private String batteryId;
    private Integer day;
    private Integer batteryPercent;
    private Double voltage;
    private Integer afterChargePercent;
    private Double afterChargeVoltage;
}