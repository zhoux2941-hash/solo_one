package com.company.grouporder.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;

@Data
public class CreateGroupOrderRequest {
    @NotBlank(message = "商家不能为空")
    private String merchant;
    
    @NotNull(message = "满减门槛不能为空")
    @DecimalMin(value = "0.01", message = "满减门槛必须大于0")
    private BigDecimal minAmount;
    
    @NotNull(message = "满减金额不能为空")
    @DecimalMin(value = "0.01", message = "满减金额必须大于0")
    private BigDecimal discountAmount;
    
    private String targetUrl;
    
    @NotBlank(message = "发起人姓名不能为空")
    private String initiatorName;
    
    @NotBlank(message = "发起人ID不能为空")
    private String initiatorUserId;
}
