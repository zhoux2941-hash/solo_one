package com.company.grouporder.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class AddItemRequest {
    @NotBlank(message = "商品名称不能为空")
    private String itemName;
    
    @NotNull(message = "商品价格不能为空")
    @DecimalMin(value = "0.01", message = "商品价格必须大于0")
    private BigDecimal price;
    
    @NotNull(message = "商品数量不能为空")
    @Min(value = 1, message = "商品数量至少为1")
    private Integer quantity;
    
    @NotBlank(message = "参与人姓名不能为空")
    private String participantName;
    
    @NotBlank(message = "参与人ID不能为空")
    private String participantUserId;
}
