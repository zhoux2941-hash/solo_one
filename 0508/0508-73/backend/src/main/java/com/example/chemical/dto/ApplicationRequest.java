package com.example.chemical.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class ApplicationRequest {
    private Long chemicalId;
    private BigDecimal quantity;
    private String purpose;
    private LocalDate expectedDate;
    private LocalDate plannedReturnDate;
}
