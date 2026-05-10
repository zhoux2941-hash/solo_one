package com.studentunion.budgetmanagement.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class BudgetChangeDTO {
    private Long id;
    private Long activityId;
    private BigDecimal originalBudget;
    private BigDecimal newBudget;
    private BigDecimal changeAmount;
    private String reason;
    private String status;
    private Long createdBy;
    private Long reviewedBy;
    private String reviewReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
}
