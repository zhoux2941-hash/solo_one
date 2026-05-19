package com.fulfillment.order.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class OrderItem {
    private Long id;
    private Long orderId;
    private String orderNo;
    private Long productId;
    private String productName;
    private BigDecimal price;
    private Integer quantity;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
}