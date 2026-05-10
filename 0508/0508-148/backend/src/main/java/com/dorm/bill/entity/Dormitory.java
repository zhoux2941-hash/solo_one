package com.dorm.bill.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("dormitory")
public class Dormitory {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String dormNumber;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
