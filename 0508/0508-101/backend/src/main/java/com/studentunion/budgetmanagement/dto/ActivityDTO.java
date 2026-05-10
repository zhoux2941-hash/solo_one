package com.studentunion.budgetmanagement.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class ActivityDTO {
    private Long id;
    private String name;
    private String department;
    private BigDecimal budgetTotal;
    private String status;
    private BigDecimal actualTotal;
    private Long createdBy;
    private List<BudgetItemDTO> budgetItems;
    private List<ActualItemDTO> actualItems;
}
