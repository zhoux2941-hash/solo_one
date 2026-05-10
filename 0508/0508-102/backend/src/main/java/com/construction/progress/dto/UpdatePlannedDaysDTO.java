package com.construction.progress.dto;

import lombok.Data;

import javax.validation.constraints.Min;
import javax.validation.constraints.NotNull;

@Data
public class UpdatePlannedDaysDTO {
    @NotNull(message = "项目ID不能为空")
    private Long projectId;
    
    @NotNull(message = "工序索引不能为空")
    private Integer stageIndex;
    
    @NotNull(message = "计划天数不能为空")
    @Min(value = 1, message = "计划天数必须大于0")
    private Integer plannedDays;
}
