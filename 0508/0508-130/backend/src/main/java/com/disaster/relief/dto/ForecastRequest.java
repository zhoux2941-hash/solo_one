package com.disaster.relief.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ForecastRequest {
    @NotBlank(message = "灾害类型不能为空")
    private String disasterType;

    @NotNull(message = "灾害强度不能为空")
    @Min(value = 1, message = "灾害强度最小为1")
    private Integer disasterIntensity;

    @NotNull(message = "受灾人口不能为空")
    @Min(value = 1, message = "受灾人口最小为1")
    private Integer affectedPopulation;
}
