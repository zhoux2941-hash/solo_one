package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class LeaderboardDTO {
    private Integer rank;
    private String employeeNo;
    private String name;
    private String department;
    private Integer points;
}
