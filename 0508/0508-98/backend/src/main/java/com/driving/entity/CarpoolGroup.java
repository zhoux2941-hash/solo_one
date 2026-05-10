package com.driving.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableLogic;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@TableName("carpool_group")
public class CarpoolGroup {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long coachId;
    private LocalDate slotDate;
    private Integer startHour;
    private Long slotId;
    private Long initiatorId;
    private Integer status;
    private Integer memberCount;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    @TableLogic
    private Integer deleted;
}