package com.industrial.workorder.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class WorkOrderStatisticsDTO {
    private LocalDate statisticsDate;
    private Long totalCount;
    private Long completedCount;
    private Long pendingCount;
    private Long inProgressCount;
    private Long rejectedCount;
    
    private Double completionRate;
    
    private Long assigneeId;
    private String assigneeName;
    private Long teamLeaderId;
    private String teamLeaderName;
    private Long deviceId;
    private String deviceName;
    private String faultType;
    private String priority;

    public WorkOrderStatisticsDTO() {
        this.totalCount = 0L;
        this.completedCount = 0L;
        this.pendingCount = 0L;
        this.inProgressCount = 0L;
        this.rejectedCount = 0L;
        this.completionRate = 0.0;
    }

    public void calculateCompletionRate() {
        if (totalCount > 0) {
            this.completionRate = (double) completedCount / totalCount * 100;
        } else {
            this.completionRate = 0.0;
        }
    }
}
