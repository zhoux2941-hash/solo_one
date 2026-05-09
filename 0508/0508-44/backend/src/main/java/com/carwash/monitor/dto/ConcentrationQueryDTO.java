package com.carwash.monitor.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConcentrationQueryDTO {
    private String machineId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}
