package com.studentunion.budgetmanagement.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BudgetItemDTO {
    private Long id;
    private String itemName;
    private BigDecimal amount;
}
