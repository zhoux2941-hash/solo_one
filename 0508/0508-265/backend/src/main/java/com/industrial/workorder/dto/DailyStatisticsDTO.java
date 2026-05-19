package com.industrial.workorder.dto;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Data
public class DailyStatisticsDTO {
    private LocalDate date;
    private Long totalCount;
    private Long completedCount;
    private Double completionRate;
    private Long pendingCount;
    private Long inProgressCount;
    private Long rejectedCount;
    
    private List<Map<String, Object>> byAssignee;
    private List<Map<String, Object>> byFaultType;
    private List<Map<String, Object>> byPriority;
    private List<Map<String, Object>> byDevice;

    public DailyStatisticsDTO() {
        this.totalCount = 0L;
        this.completedCount = 0L;
        this.completionRate = 0.0;
        this.pendingCount = 0L;
        this.inProgressCount = 0L;
        this.rejectedCount = 0L;
    }

    public void calculateCompletionRate() {
        if (totalCount > 0) {
            this.completionRate = (double) completedCount / totalCount * 100;
        } else {
            this.completionRate = 0.0;
        }
    }
}
