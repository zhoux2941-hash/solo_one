package com.example.lostfound.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@TableName("lost_item")
public class LostItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String itemName;
    private String location;
    private LocalDateTime lostTime;
    private String description;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
