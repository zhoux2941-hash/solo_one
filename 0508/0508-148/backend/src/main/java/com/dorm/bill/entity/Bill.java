package com.dorm.bill.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("bill")
public class Bill {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long dormId;
    private String billDate;
    private BigDecimal electricityAmount;
    private BigDecimal waterAmount;
    private BigDecimal totalAmount;
    private BigDecimal perPersonAmount;
    private Integer headCount;
    private Long createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
