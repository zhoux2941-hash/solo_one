package com.battery.dto;

import java.util.List;
import java.util.Map;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MultiDayResponse {
    private String simulationId;
    private Long timestamp;
    private Integer ridesPerDay;
    private Integer rideTime;
    private Integer temperature;
    private Integer chargeTarget;
    private Integer totalDays;
    private Map<String, List<DailyBatteryData>> dailyData;
    private List<String> batteryIds;
}