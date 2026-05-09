package com.carwash.monitor.dto;

import lombok.Data;

@Data
public class TeamRankDTO {
    private Integer rank;
    private Long teamId;
    private String teamName;
    private String department;
    private Integer memberCount;
    private Integer totalPoints;
    private Double avgPoints;
}
