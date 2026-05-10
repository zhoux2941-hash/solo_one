package com.cinema.popcorn.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MachineSchedule {
    private Integer machineId;
    private String startTime;
    private String endTime;
    private String status;
    private String action;
}
