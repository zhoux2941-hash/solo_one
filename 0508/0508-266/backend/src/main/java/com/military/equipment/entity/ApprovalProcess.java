package com.military.equipment.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.military.equipment.common.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("approval_process")
public class ApprovalProcess extends BaseEntity {
    private String processNo;
    private Integer processType;
    private Long equipmentId;
    private String equipmentRfid;
    private String equipmentName;
    private Long applicantId;
    private String applicantName;
    private String applicantDept;
    private String applyReason;
    private LocalDateTime applyTime;
    private LocalDate expectReturnDate;
    private String targetDept;
    private Integer currentStep;
    private Integer processStatus;
    private Long warehouseKeeperId;
    private String warehouseKeeperName;
    private String warehouseKeeperRemark;
    private LocalDateTime warehouseKeeperTime;
    private Long auditorId;
    private String auditorName;
    private String auditorRemark;
    private LocalDateTime auditorTime;
    private Integer finalStatus;
    private LocalDateTime closeTime;
}
