package com.company.grouporder.dto.stats;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class UserRanking {
    private String userId;
    private String userName;
    private int participateCount;
    private int initiateCount;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    private int rank;
    
    public UserRanking(String userId, String userName, int participateCount, int initiateCount,
                       BigDecimal totalAmount, BigDecimal finalAmount) {
        this.userId = userId;
        this.userName = userName;
        this.participateCount = participateCount;
        this.initiateCount = initiateCount;
        this.totalAmount = totalAmount;
        this.finalAmount = finalAmount;
    }
}
