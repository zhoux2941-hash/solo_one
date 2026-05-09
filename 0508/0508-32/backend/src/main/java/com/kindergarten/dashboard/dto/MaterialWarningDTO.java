package com.kindergarten.dashboard.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialWarningDTO {
    private String materialName;
    private String materialType;
    private String unit;
    private double currentStock;
    private double dailyAvgConsumption;
    private double predictedStockIn3Days;
    private double threshold;
    private LocalDate predictedShortageDate;
    private String warningLevel;
    private String warningMessage;
}
