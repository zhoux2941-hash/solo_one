package com.fulfillment.order.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class OrderItemDTO {
    @NotNull(message = "商品ID不能为空")
    private Long productId;

    @NotNull(message = "购买数量不能为空")
    @Min(value = 1, message = "购买数量最小为1")
    private Integer quantity;
}