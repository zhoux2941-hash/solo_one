package com.pest.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Positive;

@Data
public class ReportRequest {
    @NotNull(message = "农户ID不能为空")
    private Long farmerId;

    @NotBlank(message = "作物类型不能为空")
    private String cropType;

    @NotBlank(message = "描述不能为空")
    private String description;

    @NotNull(message = "发生面积不能为空")
    @Positive(message = "发生面积必须大于0")
    private Double area;
}