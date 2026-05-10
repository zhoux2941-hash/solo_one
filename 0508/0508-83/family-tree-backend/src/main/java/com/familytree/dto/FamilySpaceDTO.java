package com.familytree.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;

@Data
public class FamilySpaceDTO {
    private Long id;

    @NotBlank(message = "家族空间名称不能为空")
    @Size(max = 100, message = "家族空间名称长度不能超过100个字符")
    private String name;

    @Size(max = 500, message = "描述长度不能超过500个字符")
    private String description;
}
