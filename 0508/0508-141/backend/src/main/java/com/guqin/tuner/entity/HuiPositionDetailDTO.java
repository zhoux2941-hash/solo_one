package com.guqin.tuner.entity;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class HuiPositionDetailDTO {
    private Integer huiNumber;
    private BigDecimal theoreticalFrequency;
    private BigDecimal measuredFrequency;
    private BigDecimal centDeviation;
}
