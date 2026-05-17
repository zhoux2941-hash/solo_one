package com.metro.inspection.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class StatisticsDTO {
    private Long total;
    private Long level1;
    private Long level2;
    private Long level3;
}
