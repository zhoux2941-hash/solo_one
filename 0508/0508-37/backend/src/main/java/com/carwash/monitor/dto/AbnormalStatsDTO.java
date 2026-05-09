package com.carwash.monitor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AbnormalStatsDTO {
    private String machineId;
    private Long totalRecords;
    private Long abnormalCount;
    private Long overLimitCount;
    private Long underLimitCount;
    private Double abnormalRate;
}
