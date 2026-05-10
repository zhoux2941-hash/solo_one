package com.company.grouporder.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Data
public class ParticipantPayment {
    private String userId;
    private String userName;
    private BigDecimal totalAmount;
    private BigDecimal finalAmount;
    private BigDecimal discountAmount;
    private List<PaymentItem> items = new ArrayList<>();
    
    @Data
    public static class PaymentItem {
        private String itemName;
        private BigDecimal price;
        private Integer quantity;
        private BigDecimal subtotal;
        private BigDecimal finalPrice;
    }
}
