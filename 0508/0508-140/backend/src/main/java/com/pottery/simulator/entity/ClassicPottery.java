package com.pottery.simulator.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("classic_pottery")
public class ClassicPottery {

    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String name;
    
    private String type;
    
    private String description;
    
    private String profilePoints;
    
    private LocalDateTime createdAt;
    
    private LocalDateTime updatedAt;

}
