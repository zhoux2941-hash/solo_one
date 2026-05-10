package com.flower.preservative.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExperimentRecordDTO {
    private Long id;
    private String flowerType;
    private Integer experimentDays;
    private Double formulaAResult;
    private String formulaAStatus;
    private Double formulaBResult;
    private String formulaBStatus;
    private Double formulaCResult;
    private String formulaCStatus;
    private Double formulaDResult;
    private String formulaDStatus;
    private Boolean formulaDExists;
    private String formulaDName;
    private String recommendedFormula;
    private LocalDateTime createdAt;
    private String note;
}
