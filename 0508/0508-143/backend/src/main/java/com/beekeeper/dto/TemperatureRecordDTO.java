package com.beekeeper.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TemperatureRecordDTO {
    @NotNull(message = "记录日期不能为空")
    private LocalDate recordDate;
    
    @NotNull(message = "最高温度不能为空")
    private Double maxTemperature;
    
    @NotNull(message = "最低温度不能为空")
    private Double minTemperature;
    
    private Double avgTemperature;
    private String location;
}
