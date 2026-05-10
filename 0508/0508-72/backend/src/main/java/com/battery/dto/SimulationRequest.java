package com.battery.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SimulationRequest {

    @NotNull(message = "骑行时间不能为空")
    @Min(value = 1, message = "骑行时间至少1分钟")
    @Max(value = 120, message = "骑行时间最多120分钟")
    private Integer rideTime;

    @NotNull(message = "环境温度不能为空")
    @Min(value = -20, message = "温度范围为 -20℃ ~ 50℃")
    @Max(value = 50, message = "温度范围为 -20℃ ~ 50℃")
    private Integer temperature;
}