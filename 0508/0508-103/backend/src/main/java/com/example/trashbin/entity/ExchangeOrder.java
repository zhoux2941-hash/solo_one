package com.example.trashbin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("exchange_order")
public class ExchangeOrder {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String orderNo;
    private Long residentId;
    private Long productId;
    private String productName;
    private Integer quantity;
    private Integer pointsConsumed;
    private String status;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    private LocalDateTime verifyTime;

    @TableLogic
    private Integer deleted;
}
