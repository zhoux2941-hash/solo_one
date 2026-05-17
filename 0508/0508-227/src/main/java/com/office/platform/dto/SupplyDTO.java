package com.office.platform.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@Data
public class SupplyDTO {

    private Long id;

    @NotBlank(message = "用品名称不能为空")
    @Size(max = 100, message = "名称长度不能超过100个字符")
    private String name;

    @NotBlank(message = "分类不能为空")
    @Size(max = 50, message = "分类长度不能超过50个字符")
    private String category;

    @NotNull(message = "库存数量不能为空")
    @Min(value = 0, message = "库存数量不能小于0")
    private Integer quantity;

    @NotNull(message = "最低预警线不能为空")
    @Min(value = 1, message = "最低预警线不能小于1")
    private Integer minWarning;

    private String description;
}
