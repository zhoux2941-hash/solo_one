package com.fulfillment.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderDTO {
    @NotNull(message = "用户ID不能为空")
    private Long userId;

    @NotEmpty(message = "收货人姓名不能为空")
    private String receiverName;

    @NotEmpty(message = "收货人电话不能为空")
    private String receiverPhone;

    @NotEmpty(message = "收货地址不能为空")
    private String receiverAddress;

    @NotEmpty(message = "订单项不能为空")
    private List<OrderItemDTO> items;
}