package com.exoplanet.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Min;
import javax.validation.constraints.Max;

@Data
public class PredictionRequest {

    @NotNull(message = "恒星质量不能为空")
    @Positive(message = "恒星质量必须为正数")
    private Double starMass;

    @NotNull(message = "恒星半径不能为空")
    @Positive(message = "恒星半径必须为正数")
    private Double starRadius;

    @NotNull(message = "行星半径不能为空")
    @Positive(message = "行星半径必须为正数")
    private Double planetRadius;

    @NotNull(message = "行星距离不能为空")
    @Positive(message = "行星距离必须为正数")
    private Double planetDistance;

    @NotNull(message = "轨道倾角不能为空")
    @Min(value = 0, message = "轨道倾角最小值为0度")
    @Max(value = 90, message = "轨道倾角最大值为90度")
    private Double inclination;

    private Double lastTransitTime = 0.0;
}