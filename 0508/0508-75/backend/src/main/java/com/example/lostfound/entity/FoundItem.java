package com.example.lostfound.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("found_item")
public class FoundItem {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long userId;
    private String itemName;
    private String location;
    private LocalDateTime foundTime;
    private String description;
    private String storageLocation;
    private BigDecimal lng;
    private BigDecimal lat;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
