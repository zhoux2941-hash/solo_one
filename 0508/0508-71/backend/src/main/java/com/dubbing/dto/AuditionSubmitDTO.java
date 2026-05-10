package com.dubbing.dto;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class AuditionSubmitDTO {
    @NotNull(message = "任务ID不能为空")
    private Long taskId;
    
    private String remark;
}
