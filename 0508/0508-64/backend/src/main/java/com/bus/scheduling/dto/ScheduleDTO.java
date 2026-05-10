package com.bus.scheduling.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleDTO {
    private Long scheduleId;
    private Long driverId;
    private String driverName;
    private String driverNumber;
    private LocalTime timeSlotStart;
    private LocalTime timeSlotEnd;
    private Integer energyBefore;
    private Integer energyAfter;
    private String type;
}
