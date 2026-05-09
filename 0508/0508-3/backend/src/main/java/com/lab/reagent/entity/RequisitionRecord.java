package com.lab.reagent.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("requisition_record")
public class RequisitionRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("requisition_id")
    private Long requisitionId;
    
    @TableField("user_id")
    private Long userId;
    
    @TableField("reagent_id")
    private Long reagentId;
    
    private Integer quantity;
    private String purpose;
    
    @TableField("operation_type")
    private String operationType;
    
    @TableField("operation_time")
    private LocalDateTime operationTime;
    
    @TableField("operator_id")
    private Long operatorId;
    
    @TableField(exist = false)
    private String userName;
    
    @TableField(exist = false)
    private String reagentName;
    
    @TableField(exist = false)
    private String operatorName;
    
    @TableField(exist = false)
    private String department;
}
