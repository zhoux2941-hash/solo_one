package com.example.chemical.dto;

import lombok.Data;

@Data
public class ReturnRequest {
    private Long applicationId;
    private String overdueReason;
}
