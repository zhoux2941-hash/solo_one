package com.military.equipment.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class ApprovalAuditDTO {
    @NotNull(message = "审批ID不能为空")
    private Long id;

    @NotNull(message = "审批结果不能为空")
    private Integer result;

    private String remark;
}
