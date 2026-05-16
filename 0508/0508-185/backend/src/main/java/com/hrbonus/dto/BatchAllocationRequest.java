package com.hrbonus.dto;

import lombok.Data;
import java.util.List;

@Data
public class BatchAllocationRequest {
    private Long bonusPoolId;
    private List<AllocationRequest> allocations;
    private String changeReason;
    private Long changedBy;
}
