package com.company.grouporder.dto.stats;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class DepartmentRanking {
    private String department;
    private int userCount;
    private int participateCount;
    private int initiateCount;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    private int rank;
    
    public DepartmentRanking(String department, int userCount, int participateCount, int initiateCount,
                             BigDecimal totalAmount, BigDecimal finalAmount) {
        this.department = department;
        this.userCount = userCount;
        this.participateCount = participateCount;
        this.initiateCount = initiateCount;
        this.totalAmount = totalAmount;
        this.finalAmount = finalAmount;
    }
}
