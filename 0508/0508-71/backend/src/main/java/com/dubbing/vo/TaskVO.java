package com.dubbing.vo;

import com.dubbing.entity.VoiceTag;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
public class TaskVO {
    private Long id;
    private Long publisherId;
    private String publisherName;
    private String title;
    private String content;
    private String duration;
    private BigDecimal budget;
    private String exampleAudio;
    private Integer status;
    private Long winnerId;
    private String winnerName;
    private Integer auditionCount;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
    private List<VoiceTag> tags;
}
