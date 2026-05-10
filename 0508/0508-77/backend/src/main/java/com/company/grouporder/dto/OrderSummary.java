package com.company.grouporder.dto;

import com.company.grouporder.entity.GroupOrder;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class OrderSummary {
    private Long orderId;
    private BigDecimal currentTotal;
    private BigDecimal minAmount;
    private BigDecimal discountAmount;
    private BigDecimal remainingAmount;
    private boolean canApplyDiscount;
    private BigDecimal finalAmount;
    private int participantCount;
    private int itemCount;
    
    public OrderSummary(GroupOrder order) {
        this.orderId = order.getId();
        this.minAmount = order.getMinAmount();
        this.discountAmount = order.getDiscountAmount();
        this.currentTotal = order.getTotalAmount();
        this.canApplyDiscount = currentTotal.compareTo(minAmount) >= 0;
        this.remainingAmount = canApplyDiscount ? BigDecimal.ZERO : minAmount.subtract(currentTotal);
        this.finalAmount = canApplyDiscount ? currentTotal.subtract(discountAmount) : currentTotal;
    }
}
