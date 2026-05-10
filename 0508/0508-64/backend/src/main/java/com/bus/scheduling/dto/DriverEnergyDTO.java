package com.bus.scheduling.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DriverEnergyDTO {
    private Long driverId;
    private String driverName;
    private String driverNumber;
    private Integer currentEnergy;
    private Integer initialEnergy;
    private boolean isFatigued;
}
