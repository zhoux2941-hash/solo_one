package com.exoplanet.dto;

import lombok.Data;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;
import javax.validation.constraints.Max;
import javax.validation.constraints.Min;
import java.util.List;

@Data
public class FitRequest {

    @NotNull(message = "观测数据不能为空")
    private List<Double> observedData;

    @NotNull(message = "恒星半径不能为空")
    @Positive(message = "恒星半径必须为正数")
    private Double starRadius;

    @NotNull(message = "恒星温度不能为空")
    @Positive(message = "恒星温度必须为正数")
    private Double starTemperature;

    @NotNull(message = "轨道周期不能为空")
    @Positive(message = "轨道周期必须为正数")
    private Double orbitalPeriod;

    @NotNull(message = "拟合行星半径不能为空")
    @Positive(message = "拟合行星半径必须为正数")
    private Double fittedPlanetRadius;

    @NotNull(message = "拟合轨道倾角不能为空")
    @Min(value = 0, message = "拟合轨道倾角最小值为0度")
    @Max(value = 90, message = "拟合轨道倾角最大值为90度")
    private Double fittedInclination;

    @NotNull(message = "原始行星半径不能为空")
    @Positive(message = "原始行星半径必须为正数")
    private Double originalPlanetRadius;

    @NotNull(message = "原始轨道倾角不能为空")
    @Min(value = 0, message = "原始轨道倾角最小值为0度")
    @Max(value = 90, message = "原始轨道倾角最大值为90度")
    private Double originalInclination;

    @NotNull(message = "噪声水平不能为空")
    private Double noiseLevel;

    @Min(value = 100, message = "数据点数量最小值为100")
    @Max(value = 10000, message = "数据点数量最大值为10000")
    private Integer numPoints = 1000;

    @Min(value = 1, message = "周期数最小值为1")
    @Max(value = 10, message = "周期数最大值为10")
    private Integer numPeriods = 3;
}