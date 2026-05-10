package com.meteor.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ZHRResult {
    private Double zhr;
    private Double rawRate;
    private Double durationHours;
    private Integer meteorCount;
    private Double cloudCorrection;
    private Double lmCorrection;
    private Double zenithCorrection;
    private Double confidence;
    private String notes;
}
