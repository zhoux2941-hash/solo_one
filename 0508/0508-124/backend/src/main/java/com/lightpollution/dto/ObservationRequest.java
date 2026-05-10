package com.lightpollution.dto;

import lombok.Data;

import javax.validation.constraints.*;
import java.math.BigDecimal;

@Data
public class ObservationRequest {
    
    @NotNull(message = "纬度不能为空")
    @DecimalMin(value = "-90.0", message = "纬度最小为-90")
    @DecimalMax(value = "90.0", message = "纬度最大为90")
    private BigDecimal latitude;
    
    @NotNull(message = "经度不能为空")
    @DecimalMin(value = "-180.0", message = "经度最小为-180")
    @DecimalMax(value = "180.0", message = "经度最大为180")
    private BigDecimal longitude;
    
    @NotNull(message = "目视极限星等不能为空")
    @Min(value = 1, message = "星等最小为1")
    @Max(value = 6, message = "星等最大为6")
    private Integer magnitude;
    
    @Size(max = 100)
    private String locationName;
    
    private String description;
    
    @Size(max = 50)
    private String weather;
}
