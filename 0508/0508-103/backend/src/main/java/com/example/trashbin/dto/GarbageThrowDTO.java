package com.example.trashbin.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import java.math.BigDecimal;

@Data
public class GarbageThrowDTO {
    @NotNull(message = "居民ID不能为空")
    private Long residentId;
    
    @NotNull(message = "垃圾类型不能为空")
    private String garbageType;
    
    @NotNull(message = "重量不能为空")
    @Positive(message = "重量必须大于0")
    private BigDecimal weight;
    
    private String requestId;
}
