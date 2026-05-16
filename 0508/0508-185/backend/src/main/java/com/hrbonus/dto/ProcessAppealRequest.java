package com.hrbonus.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProcessAppealRequest {
    private Long appealId;
    private String status;
    private String managerComment;
    private BigDecimal newPercentage;
    private String changeReason;
    private Long managerId;
}
