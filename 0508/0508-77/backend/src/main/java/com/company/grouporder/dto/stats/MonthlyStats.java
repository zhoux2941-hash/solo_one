package com.company.grouporder.dto.stats;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class MonthlyStats {
    private String month;
    private int orderCount;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    
    public MonthlyStats(String month, int orderCount, BigDecimal totalAmount, BigDecimal finalAmount) {
        this.month = month;
        this.orderCount = orderCount;
        this.totalAmount = totalAmount;
        this.finalAmount = finalAmount;
    }
}
