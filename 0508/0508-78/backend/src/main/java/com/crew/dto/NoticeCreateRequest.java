package com.crew.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
public class NoticeCreateRequest {
    @NotNull(message = "日期不能为空")
    private LocalDate noticeDate;
    
    @NotBlank(message = "场景名称不能为空")
    private String sceneName;
    
    @NotNull(message = "开始时间不能为空")
    private LocalTime startTime;
    
    @NotNull(message = "结束时间不能为空")
    private LocalTime endTime;
    
    @NotEmpty(message = "演员列表不能为空")
    private List<Long> actorIds;
    
    private String costumeRequirement;
    private String propRequirement;
}