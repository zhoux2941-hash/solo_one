package com.driving.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("coach")
public class Coach {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String carModel;
    private BigDecimal avgRating;
    private Integer ratingCount;
    private Integer acceptCarpool;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}