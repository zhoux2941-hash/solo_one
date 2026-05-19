package com.fulfillment.order.entity;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class FulfillmentLog {
    private Long id;
    private String orderNo;
    private Long userId;
    private String operationType;
    private String operationDesc;
    private String operator;
    private String beforeStatus;
    private String afterStatus;
    private LocalDateTime createdAt;
}