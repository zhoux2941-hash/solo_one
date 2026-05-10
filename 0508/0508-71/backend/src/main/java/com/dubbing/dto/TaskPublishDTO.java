package com.dubbing.dto;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

@Data
public class TaskPublishDTO {
    @NotBlank(message = "标题不能为空")
    @Size(max = 100, message = "标题不能超过100字")
    private String title;
    
    @NotBlank(message = "内容不能为空")
    @Size(max = 200, message = "内容不能超过200字")
    private String content;
    
    @NotBlank(message = "时长要求不能为空")
    private String duration;
    
    @NotNull(message = "预算不能为空")
    private BigDecimal budget;
    
    private List<Long> tagIds;
}
