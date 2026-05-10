package com.milktea.predictor.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("combo_weight")
public class ComboWeight {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String comboKey;
    private String teaBase;
    private String toppings;
    private BigDecimal avgRating;
    private Integer feedbackCount;
    private BigDecimal weight;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
