package com.fulfillment.order.dto;

import lombok.Data;

@Data
public class OrderQueryDTO {
    private String orderNo;
    private Long userId;
    private String status;
    private Integer pageNum = 1;
    private Integer pageSize = 10;
}