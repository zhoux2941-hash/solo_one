package com.fulfillment.order.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class Order {
    private Long id;
    private String orderNo;
    private Long userId;
    private BigDecimal totalAmount;
    private String status;
    private String receiverName;
    private String receiverPhone;
    private String receiverAddress;
    private LocalDateTime paymentTime;
    private LocalDateTime shipTime;
    private LocalDateTime deliveryTime;
    private LocalDateTime cancelTime;
    private String cancelReason;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItem> items;
}