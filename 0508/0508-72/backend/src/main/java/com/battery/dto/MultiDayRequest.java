package com.battery.dto;

import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;
import lombok.Data;

@Data
public class MultiDayRequest {

    @NotNull(message = "每日骑行次数不能为空")
    @Min(value = 1, message = "每日骑行次数至少1次")
    @Max(value = 10, message = "每日骑行次数最多10次")
    private Integer ridesPerDay;

    @NotNull(message = "单次骑行时间不能为空")
    @Min(value = 1, message = "单次骑行时间至少1分钟")
    @Max(value = 120, message = "单次骑行时间最多120分钟")
    private Integer rideTime;

    @NotNull(message = "环境温度不能为空")
    @Min(value = -20, message = "温度范围为 -20℃ ~ 50℃")
    @Max(value = 50, message = "温度范围为 -20℃ ~ 50℃")
    private Integer temperature;

    @NotNull(message = "充电策略不能为空")
    @Min(value = 80, message = "充电策略只能是80或100")
    @Max(value = 100, message = "充电策略只能是80或100")
    private Integer chargeTarget;

    @Min(value = 1, message = "模拟天数至少1天")
    @Max(value = 30, message = "最多模拟30天")
    private Integer days = 7;
}