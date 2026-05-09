package com.lab.reagent.dto;

import lombok.Data;

@Data
public class MonthlyStatsDTO {
    private Long reagentId;
    private String reagentName;
    private String category;
    private String specification;
    private Integer totalQuantity;
    private Integer approvalCount;
    private String unit;
}
