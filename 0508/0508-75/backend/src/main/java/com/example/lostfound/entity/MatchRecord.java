package com.example.lostfound.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("match_record")
public class MatchRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long lostItemId;
    private Long foundItemId;
    private BigDecimal matchScore;
    private Integer status;
    private String confirmedBy;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
