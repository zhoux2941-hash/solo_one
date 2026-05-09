package com.wheelchair.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class YearOverYearResponse {
    private String wheelchairId;
    private Double growthRate;
    private Integer lastMonthWear;
    private Integer currentMonthWear;
}
