package com.example.trashbin.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("garbage_record")
public class GarbageRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long residentId;
    private String garbageType;
    private BigDecimal weight;
    private Integer pointsEarned;

    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;

    @TableLogic
    private Integer deleted;
}
