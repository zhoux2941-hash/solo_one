package com.beekeeper.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class HiveRecordDTO {
    private Long id;
    
    @NotNull(message = "蜂箱ID不能为空")
    private Long beehiveId;
    
    @NotNull(message = "记录日期不能为空")
    private LocalDate recordDate;
    
    private Double morningTemperature;
    private Double eveningTemperature;
    
    @Max(value = 100, message = "湿度最大为100%")
    private Double morningHumidity;
    
    @Max(value = 100, message = "湿度最大为100%")
    private Double eveningHumidity;
    
    @NotNull(message = "活动强度不能为空")
    @Min(value = 1, message = "活动强度最小为1")
    @Max(value = 10, message = "活动强度最大为10")
    private Integer activityLevel;
    
    private Double outsideTemperature;
    
    @Max(value = 100, message = "湿度最大为100%")
    private Double outsideHumidity;
    
    private String notes;
}
