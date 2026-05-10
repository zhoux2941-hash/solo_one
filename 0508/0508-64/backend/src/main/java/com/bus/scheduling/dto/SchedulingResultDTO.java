package com.bus.scheduling.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SchedulingResultDTO {
    private boolean success;
    private String message;
    private List<ScheduleDTO> schedules;
    private List<DriverEnergyDTO> driverEnergies;
    private List<String> warnings;
}
