package com.office.platform.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class DepartmentDTO {

    private Long id;

    @NotBlank(message = "部门名称不能为空")
    private String name;

    private String description;

    @NotNull(message = "状态不能为空")
    private Boolean enabled;
}