package com.milktea.predictor.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("rating_feedback")
public class RatingFeedback {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String teaBase;
    private String toppings;
    private String comboKey;
    private BigDecimal predictedRating;
    private Integer actualRating;
    private LocalDateTime createTime;
}
