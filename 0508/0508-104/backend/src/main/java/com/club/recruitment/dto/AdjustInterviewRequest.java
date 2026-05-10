package com.club.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AdjustInterviewRequest {
    @NotNull(message = "报名者ID不能为空")
    private Long applicantId;

    @NotNull(message = "目标部门ID不能为空")
    private Long targetDepartmentId;

    @NotBlank(message = "目标时间段不能为空")
    private String targetSlot;
}