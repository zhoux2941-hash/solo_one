package com.hrbonus.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class AllocationRequest {
    private Long employeeId;
    private BigDecimal percentage;
    private String remarks;
}
