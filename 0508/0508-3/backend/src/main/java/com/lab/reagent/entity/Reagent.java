package com.lab.reagent.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableField;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("reagent")
public class Reagent {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String category;
    private String specification;
    private String unit;
    private Integer quantity;
    private String location;
    private String description;

    @TableField("expiry_date")
    private LocalDateTime expiryDate;

    @TableField("create_time")
    private LocalDateTime createTime;

    @TableField("update_time")
    private LocalDateTime updateTime;

    @TableField(exist = false)
    private Integer expireStatus;
}
