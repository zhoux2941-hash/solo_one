package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class CreateTeamRequestDTO {
    private String employeeNo;
    private String name;
    private String description;
}
