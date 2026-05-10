package com.example.trashbin.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class ExchangeOrderDTO {
    @NotNull(message = "居民ID不能为空")
    private Long residentId;
    
    @NotNull(message = "商品ID不能为空")
    private Long productId;
    
    @NotNull(message = "数量不能为空")
    @Positive(message = "数量必须大于0")
    private Integer quantity;
    
    private String requestId;
}
