package com.meteor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RadiantPointResult {
    private Double ra;
    private Double dec;
    private String constellation;
    private Double confidence;
    private Integer recordCount;
}
