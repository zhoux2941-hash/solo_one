package com.woodjoin.dto;

import com.woodjoin.enums.JoinType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StressSimulationDTO {

    @NotNull(message = "榫卯类型不能为空")
    private JoinType joinType;

    @NotNull(message = "木料长度不能为空")
    @Min(value = 10, message = "木料长度至少为10mm")
    private Double woodLength;

    @NotNull(message = "木料宽度不能为空")
    @Min(value = 10, message = "木料宽度至少为10mm")
    private Double woodWidth;

    @NotNull(message = "木料高度不能为空")
    @Min(value = 10, message = "木料高度至少为10mm")
    private Double woodHeight;

    @NotNull(message = "榫头长度不能为空")
    @Min(value = 5, message = "榫头长度至少为5mm")
    private Double tenonLength;

    @NotNull(message = "榫头宽度不能为空")
    @Min(value = 5, message = "榫头宽度至少为5mm")
    private Double tenonWidth;

    @NotNull(message = "榫头高度不能为空")
    @Min(value = 5, message = "榫头高度至少为5mm")
    private Double tenonHeight;

    @NotNull(message = "余量不能为空")
    @Min(value = 0, message = "余量不能为负数")
    private Double margin;

    @NotNull(message = "载荷大小不能为空")
    @Min(value = 10, message = "载荷至少为10N")
    private Double loadForce;

    @NotBlank(message = "载荷方向不能为空")
    private String loadDirection;
}