package com.lab.reagent.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("requisition")
public class Requisition {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    @TableField("user_id")
    private Long userId;
    
    @TableField("reagent_id")
    private Long reagentId;
    
    private Integer quantity;
    private String purpose;
    private String status;
    
    @TableField("create_time")
    private LocalDateTime createTime;
    
    @TableField("update_time")
    private LocalDateTime updateTime;
    
    @TableField("approver_id")
    private Long approverId;
    
    private String remark;
    
    @TableField(exist = false)
    private String userName;
    
    @TableField(exist = false)
    private String reagentName;
    
    @TableField(exist = false)
    private String approverName;
    
    @TableField(exist = false)
    private String department;
}
