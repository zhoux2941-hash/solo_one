package com.example.trashbin.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class ProductDTO {
    private Long id;
    
    @NotBlank(message = "商品名称不能为空")
    private String name;
    
    @NotNull(message = "所需积分不能为空")
    @Positive(message = "所需积分必须大于0")
    private Integer pointsRequired;
    
    @NotNull(message = "库存不能为空")
    private Integer stock;
}
