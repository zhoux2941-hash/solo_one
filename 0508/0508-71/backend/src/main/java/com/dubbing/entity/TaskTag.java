package com.dubbing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("task_tag")
public class TaskTag {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long taskId;
    
    private Long tagId;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
