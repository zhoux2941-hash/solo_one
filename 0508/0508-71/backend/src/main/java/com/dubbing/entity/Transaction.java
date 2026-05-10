package com.dubbing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("transaction")
public class Transaction {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private Integer type;
    
    private BigDecimal amount;
    
    private BigDecimal balance;
    
    private String description;
    
    private Long relatedTaskId;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    private Integer status;
}
