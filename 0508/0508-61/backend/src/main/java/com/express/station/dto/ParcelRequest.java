package com.express.station.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ParcelRequest {
    
    @NotBlank(message = "包裹编号不能为空")
    private String parcelNo;

    @NotNull(message = "长度不能为空")
    @Min(value = 1, message = "长度必须大于0")
    private Double length;

    @NotNull(message = "宽度不能为空")
    @Min(value = 1, message = "宽度必须大于0")
    private Double width;

    @NotNull(message = "高度不能为空")
    @Min(value = 1, message = "高度必须大于0")
    private Double height;
}
