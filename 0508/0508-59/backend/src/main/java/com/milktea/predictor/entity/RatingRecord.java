package com.milktea.predictor.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("rating_record")
public class RatingRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String teaBase;
    private String toppings;
    private BigDecimal predictedRating;
    private LocalDateTime createTime;
}
