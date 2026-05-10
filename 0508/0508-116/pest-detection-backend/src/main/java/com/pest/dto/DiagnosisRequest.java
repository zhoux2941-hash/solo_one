package com.pest.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class DiagnosisRequest {
    @NotNull(message = "专家ID不能为空")
    private Long expertId;

    @NotBlank(message = "诊断内容不能为空")
    private String diagnosisText;

    @NotBlank(message = "病虫害名称不能为空")
    private String pestName;

    @NotBlank(message = "用药建议不能为空")
    private String medicineSuggestion;

    @NotBlank(message = "严重程度不能为空")
    private String severity;
}