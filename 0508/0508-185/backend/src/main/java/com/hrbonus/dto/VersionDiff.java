package com.hrbonus.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class VersionDiff {
    private Long employeeId;
    private String employeeName;
    private BigDecimal oldPercentage;
    private BigDecimal newPercentage;
    private BigDecimal oldAmount;
    private BigDecimal newAmount;
    private String changeReason;
}
