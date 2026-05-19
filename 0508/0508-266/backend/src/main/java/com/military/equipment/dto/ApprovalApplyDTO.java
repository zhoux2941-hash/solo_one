package com.military.equipment.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import java.time.LocalDate;

@Data
public class ApprovalApplyDTO {
    @NotNull(message = "装备ID不能为空")
    private Long equipmentId;

    @NotNull(message = "申请类型不能为空")
    private Integer processType;

    @NotBlank(message = "申请原因不能为空")
    private String applyReason;

    private LocalDate expectReturnDate;
    private String targetDept;
}
