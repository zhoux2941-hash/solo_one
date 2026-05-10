package com.driving.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("rating")
public class Rating {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long bookingId;
    private Long studentId;
    private Long coachId;
    private Integer score;
    private String comment;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}