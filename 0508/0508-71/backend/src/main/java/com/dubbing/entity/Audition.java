package com.dubbing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("audition")
public class Audition {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long taskId;
    
    private Long voiceActorId;
    
    private String audioPath;
    
    private String remark;
    
    private Integer status;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
    
    @TableField(fill = FieldFill.INSERT_UPDATE)
    private LocalDateTime updateTime;
    
    @TableLogic
    private Integer deleted;
}
