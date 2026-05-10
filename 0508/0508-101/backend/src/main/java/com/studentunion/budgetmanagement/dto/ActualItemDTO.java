package com.studentunion.budgetmanagement.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ActualItemDTO {
    private Long id;
    private String itemName;
    private BigDecimal amount;
}
