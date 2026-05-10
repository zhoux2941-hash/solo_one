package com.company.grouporder.dto.stats;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UserMonthlyStats {
    private String month;
    private int participateCount;
    private int initiateCount;
    private BigDecimal totalContribution;
    private BigDecimal finalContribution;
    
    public UserMonthlyStats(String month, int participateCount, int initiateCount, 
                            BigDecimal totalContribution, BigDecimal finalContribution) {
        this.month = month;
        this.participateCount = participateCount;
        this.initiateCount = initiateCount;
        this.totalContribution = totalContribution;
        this.finalContribution = finalContribution;
    }
}
