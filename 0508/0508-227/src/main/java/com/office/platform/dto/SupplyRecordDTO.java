package com.office.platform.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
public class SupplyRecordDTO {

    private Long id;

    @NotNull(message = "用品ID不能为空")
    private Long supplyId;

    @NotNull(message = "数量不能为空")
    @Min(value = 1, message = "数量不能小于1")
    private Integer quantity;

    private String remark;
}
