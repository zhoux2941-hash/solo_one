package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class TeamContributionDTO {
    private String employeeNo;
    private String employeeName;
    private Integer contributionPoints;
    private Double contributionRatio;
}
