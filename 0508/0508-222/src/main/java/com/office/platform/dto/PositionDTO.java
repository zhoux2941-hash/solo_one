package com.office.platform.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Data
public class PositionDTO {

    private Long id;

    @NotBlank(message = "岗位名称不能为空")
    private String name;

    private String level;

    private Long departmentId;

    private String description;

    @NotNull(message = "状态不能为空")
    private Boolean enabled;
}
