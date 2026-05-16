package com.hrbonus.dto;

import lombok.Data;

@Data
public class AppealRequest {
    private Long allocationId;
    private Long employeeId;
    private String reason;
}
