package com.club.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class DepartmentRequest {
    @NotBlank(message = "部门名称不能为空")
    private String name;

    @NotNull(message = "最大容量不能为空")
    private Integer maxCapacity;

    @NotNull(message = "每个时间段面试官数量不能为空")
    private Integer interviewersPerSlot;

    private String availableSlots;
}