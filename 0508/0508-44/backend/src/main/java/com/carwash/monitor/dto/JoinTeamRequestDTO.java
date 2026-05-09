package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class JoinTeamRequestDTO {
    private String employeeNo;
    private Long teamId;
}
