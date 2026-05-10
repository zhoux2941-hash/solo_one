package com.dubbing.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AuditionVO {
    private Long id;
    private Long taskId;
    private String taskTitle;
    private Long voiceActorId;
    private String voiceActorName;
    private String audioPath;
    private String remark;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
