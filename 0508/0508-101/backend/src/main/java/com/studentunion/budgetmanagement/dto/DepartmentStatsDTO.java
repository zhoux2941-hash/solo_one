package com.studentunion.budgetmanagement.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class DepartmentStatsDTO {
    private String department;
    private BigDecimal totalBudget;
    private BigDecimal totalActual;
    private BigDecimal executionRate;
}
