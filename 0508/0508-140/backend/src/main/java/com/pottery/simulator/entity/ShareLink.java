package com.pottery.simulator.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("share_link")
public class ShareLink {

    @TableId(type = IdType.AUTO)
    private Long id;
    
    private String shareCode;
    
    private Long potteryId;
    
    private String potteryType;
    
    private LocalDateTime expiryTime;
    
    private Integer viewCount;
    
    private LocalDateTime createdAt;

}
