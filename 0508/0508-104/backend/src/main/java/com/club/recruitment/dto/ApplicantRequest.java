package com.club.recruitment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class ApplicantRequest {
    @NotBlank(message = "姓名不能为空")
    private String name;

    @NotBlank(message = "学号不能为空")
    private String studentId;

    @NotEmpty(message = "请至少选择一个意向部门")
    @Size(max = 3, message = "最多只能选择3个意向部门")
    private List<String> preferredDepartments;

    @NotNull(message = "请选择是否接受调剂")
    private Boolean acceptAdjustment;

    @NotEmpty(message = "请至少选择一个空闲时间段")
    private List<String> freeSlots;
}