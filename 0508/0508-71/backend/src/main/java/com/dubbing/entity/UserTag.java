package com.dubbing.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_tag")
public class UserTag {
    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private Long tagId;
    
    @TableField(fill = FieldFill.INSERT)
    private LocalDateTime createTime;
}
