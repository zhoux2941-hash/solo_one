package com.lightpollution.dto;

import lombok.Data;

import javax.validation.constraints.DecimalMax;
import javax.validation.constraints.DecimalMin;
import javax.validation.constraints.NotNull;
import java.math.BigDecimal;

@Data
public class BoundingBoxRequest {
    
    @NotNull(message = "最小纬度不能为空")
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private BigDecimal minLat;
    
    @NotNull(message = "最大纬度不能为空")
    @DecimalMin("-90.0")
    @DecimalMax("90.0")
    private BigDecimal maxLat;
    
    @NotNull(message = "最小经度不能为空")
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private BigDecimal minLng;
    
    @NotNull(message = "最大经度不能为空")
    @DecimalMin("-180.0")
    @DecimalMax("180.0")
    private BigDecimal maxLng;
}
