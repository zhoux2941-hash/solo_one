package com.pottery.simulator.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("user_pottery")
public class UserPottery {

    @TableId(type = IdType.AUTO)
    private Long id;
    
    private Long userId;
    
    private String name;
    
    private String profilePoints;
    
    private Integer rotationSegments;
    
    private Double smoothness;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

}
